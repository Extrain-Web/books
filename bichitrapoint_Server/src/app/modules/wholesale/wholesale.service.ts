import mongoose from 'mongoose';
import { WholesaleCustomer, IWholesaleCustomer } from './wholesaleCustomer.model';
import { WholesaleOrder, IWholesaleOrder } from './wholesaleOrder.model';
import { Product } from '../product/product.model';
import AppError from '../../utils/AppError';

export const WholesaleService = {
    // ── 1. Customer Operations ─────────────────────────────────────────
    async createCustomer(payload: Partial<IWholesaleCustomer>) {
        const existing = await WholesaleCustomer.findOne({
            phone: payload.phone?.trim(),
            isDeleted: false,
        });
        if (existing) {
            throw new AppError(400, `Wholesale customer already exists with phone: ${payload.phone}`);
        }

        const openingBalance = Number(payload.openingBalance) || 0;
        const customer = await WholesaleCustomer.create({
            ...payload,
            openingBalance,
            currentDue: openingBalance,
        });
        return customer;
    },

    async getAllCustomers(query: Record<string, any>) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
        const skip = (page - 1) * limit;

        const filter: Record<string, any> = { isDeleted: false };

        if (query.customerType) {
            filter.customerType = query.customerType;
        }

        if (query.status === 'active') filter.isActive = true;
        if (query.status === 'inactive') filter.isActive = false;

        if (query.search) {
            const searchRegex = new RegExp(String(query.search).trim(), 'i');
            filter.$or = [
                { businessName: searchRegex },
                { contactName: searchRegex },
                { phone: searchRegex },
                { address: searchRegex },
                { city: searchRegex },
            ];
        }

        const [customers, total] = await Promise.all([
            WholesaleCustomer.find(filter)
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            WholesaleCustomer.countDocuments(filter),
        ]);

        return {
            data: customers,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    },

    async getCustomerById(id: string) {
        const customer = await WholesaleCustomer.findOne({ _id: id, isDeleted: false });
        if (!customer) throw new AppError(404, 'Wholesale customer not found');

        // Fetch customer's recent orders
        const orders = await WholesaleOrder.find({ customer: id })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        return {
            customer,
            recentOrders: orders,
        };
    },

    async updateCustomer(id: string, payload: Partial<IWholesaleCustomer>) {
        const customer = await WholesaleCustomer.findOne({ _id: id, isDeleted: false });
        if (!customer) throw new AppError(404, 'Wholesale customer not found');

        if (payload.phone && payload.phone !== customer.phone) {
            const duplicate = await WholesaleCustomer.findOne({
                _id: { $ne: id },
                phone: payload.phone.trim(),
                isDeleted: false,
            });
            if (duplicate) throw new AppError(400, 'Phone number is already used by another customer');
        }

        if (payload.openingBalance !== undefined) {
            customer.openingBalance = Math.max(0, Number(payload.openingBalance) || 0);
        }

        if (payload.currentDue !== undefined) {
            const newDue = Math.max(0, Number(payload.currentDue) || 0);
            customer.currentDue = newDue;
            const totalPayable = Math.max((customer.totalBilled || 0) + (customer.openingBalance || 0), newDue);
            customer.totalPaid = Math.max(0, totalPayable - newDue);
        } else if (payload.totalPaid !== undefined) {
            const newPaid = Math.max(0, Number(payload.totalPaid) || 0);
            customer.totalPaid = newPaid;
            const totalPayable = (customer.totalBilled || 0) + (customer.openingBalance || 0);
            customer.currentDue = Math.max(0, totalPayable - newPaid);
        }

        Object.assign(customer, payload);

        // Keep recalculated financial values authoritative
        if (payload.currentDue !== undefined) {
            const newDue = Math.max(0, Number(payload.currentDue) || 0);
            const totalPayable = Math.max((customer.totalBilled || 0) + (customer.openingBalance || 0), newDue);
            customer.currentDue = newDue;
            customer.totalPaid = Math.max(0, totalPayable - newDue);
        }

        await customer.save();
        return customer;
    },

    async deleteCustomer(id: string) {
        const customer = await WholesaleCustomer.findOne({ _id: id, isDeleted: false });
        if (!customer) throw new AppError(404, 'Wholesale customer not found');

        customer.isDeleted = true;
        await customer.save();
        return { message: 'Wholesale customer deleted successfully' };
    },

    // ── 2. Order & Invoice Operations ──────────────────────────────────
    async createOrder(payload: any, adminUserId?: string) {
        const customer = await WholesaleCustomer.findOne({ _id: payload.customerId, isDeleted: false });
        if (!customer) throw new AppError(404, 'Wholesale customer not found');

        // Generate sequential unique invoice number e.g. WS-2026-0001
        const year = new Date().getFullYear();
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59);

        const orderCountThisYear = await WholesaleOrder.countDocuments({
            createdAt: { $gte: startOfYear, $lte: endOfYear },
        });
        const sequence = String(orderCountThisYear + 1).padStart(4, '0');
        const invoiceNumber = `WS-${year}-${sequence}`;

        // Validate items and calculate subtotal
        let subtotal = 0;
        const items = (payload.items || []).map((item: any) => {
            const qty = Number(item.quantity) || 1;
            const unitPrice = Number(item.unitPrice) || 0;
            const total = qty * unitPrice;
            subtotal += total;

            return {
                product: new mongoose.Types.ObjectId(item.product),
                name: item.name,
                sku: item.sku || '',
                thumbnail: item.thumbnail || '',
                variantLabel: item.variantLabel || '',
                quantity: qty,
                unitPrice,
                retailPrice: Number(item.retailPrice) || 0,
                total,
            };
        });

        if (items.length === 0) {
            throw new AppError(400, 'Order must contain at least one item');
        }

        const discount = Math.max(0, Number(payload.discount) || 0);
        const deliveryCharge = Math.max(0, Number(payload.deliveryCharge) || 0);
        const grandTotal = Math.max(0, subtotal - discount + deliveryCharge);
        const paidAmount = Math.max(0, Number(payload.paidAmount) || 0);
        const dueAmount = Math.max(0, grandTotal - paidAmount);

        let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';
        if (dueAmount <= 0) {
            paymentStatus = 'paid';
        } else if (paidAmount > 0) {
            paymentStatus = 'partial';
        }

        const previousDue = Number(customer.currentDue) || 0;

        const order = await WholesaleOrder.create({
            invoiceNumber,
            customer: customer._id,
            customerSnapshot: {
                businessName: customer.businessName,
                contactName: customer.contactName,
                phone: customer.phone,
                email: customer.email,
                address: customer.address,
                city: customer.city,
                customerType: customer.customerType,
            },
            items,
            subtotal,
            discount,
            deliveryCharge,
            grandTotal,
            paidAmount,
            dueAmount,
            previousDue,
            paymentStatus,
            orderStatus: payload.orderStatus || 'confirmed',
            paymentMethod: payload.paymentMethod || 'cash',
            paymentTerms: payload.paymentTerms || 'Payment due within 15 days of invoice date.',
            returnPolicy: payload.returnPolicy || 'Damaged or defective goods must be notified within 48 hours of delivery.',
            notes: payload.notes || '',
            orderDate: payload.orderDate ? new Date(payload.orderDate) : new Date(),
            dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
            createdAdmin: adminUserId ? new mongoose.Types.ObjectId(adminUserId) : null,
        });

        // Update customer balance & counters
        customer.totalOrders = (customer.totalOrders || 0) + 1;
        customer.totalBilled = (customer.totalBilled || 0) + grandTotal;
        customer.totalPaid = (customer.totalPaid || 0) + paidAmount;
        customer.currentDue = (customer.currentDue || 0) + dueAmount;
        await customer.save();

        return order;
    },

    async getAllOrders(query: Record<string, any>) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
        const skip = (page - 1) * limit;

        const filter: Record<string, any> = {};

        if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
        if (query.orderStatus) filter.orderStatus = query.orderStatus;
        if (query.customerId) filter.customer = query.customerId;

        if (query.search) {
            const searchRegex = new RegExp(String(query.search).trim(), 'i');
            filter.$or = [
                { invoiceNumber: searchRegex },
                { 'customerSnapshot.businessName': searchRegex },
                { 'customerSnapshot.contactName': searchRegex },
                { 'customerSnapshot.phone': searchRegex },
            ];
        }

        if (query.startDate && query.endDate) {
            filter.orderDate = {
                $gte: new Date(query.startDate),
                $lte: new Date(query.endDate),
            };
        }

        const [orders, total] = await Promise.all([
            WholesaleOrder.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('customer', 'businessName phone currentDue')
                .lean(),
            WholesaleOrder.countDocuments(filter),
        ]);

        return {
            data: orders,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    },

    async getOrderById(id: string) {
        const order = await WholesaleOrder.findById(id)
            .populate('customer', 'businessName contactName phone email address city customerType currentDue')
            .populate('createdAdmin', 'firstName lastName email');
        if (!order) throw new AppError(404, 'Wholesale order not found');
        return order;
    },

    async updateOrder(id: string, payload: any) {
        const order = await WholesaleOrder.findById(id);
        if (!order) throw new AppError(404, 'Wholesale order not found');

        const customer = await WholesaleCustomer.findById(order.customer);

        const oldGrandTotal = order.grandTotal;
        const oldPaid = order.paidAmount;
        const oldDue = order.dueAmount;

        // Handle items update
        if (payload.items && Array.isArray(payload.items) && payload.items.length > 0) {
            let subtotal = 0;
            const newItems = payload.items.map((item: any) => {
                const qty = Number(item.quantity) || 1;
                const unitPrice = Number(item.unitPrice) || 0;
                const total = qty * unitPrice;
                subtotal += total;
                return {
                    product: new mongoose.Types.ObjectId(item.product),
                    name: item.name,
                    sku: item.sku || '',
                    thumbnail: item.thumbnail || '',
                    variantLabel: item.variantLabel || '',
                    quantity: qty,
                    unitPrice,
                    retailPrice: Number(item.retailPrice) || 0,
                    total,
                };
            });
            order.items = newItems as any;
            order.subtotal = subtotal;
        }

        if (payload.discount !== undefined) order.discount = Math.max(0, Number(payload.discount) || 0);
        if (payload.deliveryCharge !== undefined) order.deliveryCharge = Math.max(0, Number(payload.deliveryCharge) || 0);

        // Recalculate grand total
        order.grandTotal = Math.max(0, order.subtotal - (order.discount || 0) + (order.deliveryCharge || 0));

        // Handle paid amount & due amount adjustment
        const newPaid = payload.paidAmount !== undefined ? Math.max(0, Number(payload.paidAmount)) : order.paidAmount;
        order.paidAmount = newPaid;
        order.dueAmount = Math.max(0, order.grandTotal - newPaid);

        if (order.dueAmount <= 0) {
            order.paymentStatus = 'paid';
        } else if (order.paidAmount > 0) {
            order.paymentStatus = 'partial';
        } else {
            order.paymentStatus = 'unpaid';
        }

        if (payload.paymentStatus) {
            order.paymentStatus = payload.paymentStatus;
        }

        if (payload.orderStatus) order.orderStatus = payload.orderStatus;
        if (payload.paymentMethod) order.paymentMethod = payload.paymentMethod;
        if (payload.previousDue !== undefined) order.previousDue = Math.max(0, Number(payload.previousDue));
        if (payload.notes !== undefined) order.notes = payload.notes;
        if (payload.paymentTerms) order.paymentTerms = payload.paymentTerms;
        if (payload.returnPolicy) order.returnPolicy = payload.returnPolicy;
        if (payload.dueDate !== undefined) order.dueDate = payload.dueDate ? new Date(payload.dueDate) : undefined;

        // Update customer balance & counters
        if (customer) {
            const billedDiff = order.grandTotal - oldGrandTotal;
            const paidDiff = order.paidAmount - oldPaid;
            const dueDiff = order.dueAmount - oldDue;

            customer.totalBilled = Math.max(0, (customer.totalBilled || 0) + billedDiff);
            customer.totalPaid = Math.max(0, (customer.totalPaid || 0) + paidDiff);
            customer.currentDue = Math.max(0, (customer.currentDue || 0) + dueDiff);
            await customer.save();
        }

        await order.save();
        return order;
    },

    // ── 3. Wholesale Dashboard Metrics ─────────────────────────────────
    async getStats() {
        const [
            totalOrders,
            totalCustomers,
            totals,
            pendingDueCount,
        ] = await Promise.all([
            WholesaleOrder.countDocuments(),
            WholesaleCustomer.countDocuments({ isDeleted: false }),
            WholesaleOrder.aggregate([
                {
                    $group: {
                        _id: null,
                        totalBilled: { $sum: '$grandTotal' },
                        totalPaid: { $sum: '$paidAmount' },
                        totalDue: { $sum: '$dueAmount' },
                    },
                },
            ]),
            WholesaleOrder.countDocuments({ dueAmount: { $gt: 0 } }),
        ]);

        const summary = totals[0] || { totalBilled: 0, totalPaid: 0, totalDue: 0 };

        return {
            totalOrders,
            totalCustomers,
            totalBilled: summary.totalBilled,
            totalPaid: summary.totalPaid,
            totalDue: summary.totalDue,
            pendingDueCount,
        };
    },

    // ── 4. Lightweight Product Picker for Order Creation ───────────────
    async getWholesaleProducts(search?: string) {
        const filter: Record<string, any> = {
            isDeleted: false,
        };

        if (search) {
            filter.$or = [
                { name: new RegExp(String(search).trim(), 'i') },
                { sku: new RegExp(String(search).trim(), 'i') },
                { tags: new RegExp(String(search).trim(), 'i') },
            ];
        }

        const products = await Product.find(filter)
            .select('name slug sku thumbnail price originalPrice wholesalePrice stock productType variants sizes colors colorHex status visibility category')
            .sort({ createdAt: -1 })
            .lean();

        return products;
    },
};
