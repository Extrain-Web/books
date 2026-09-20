import { Types } from 'mongoose';
import { Order } from './order.model';
import { Product } from '../product/product.model';
import { User } from '../user/user.model';
import { Coupon } from '../coupon/coupon.model';
import { getEligibleAmount, computeCouponDiscount } from '../coupon/coupon.service';
import AppError from '../../utils/AppError';
import QueryBuilder from '../../utils/QueryBuilder';
import { notifyOrderToWhatsApp } from '../../utils/whatsappNotify';
import { emitFinanceUpdate } from '../../utils/socket';
import { computeShippingCost } from '../shipping/shipping.service';

/**
 * Tell the customer their payment status changed. Shared by the admin's manual
 * "mark as paid" and by the payment-gateway callback, so money moving through
 * either path notifies identically. Fire-and-forget — a notification failure
 * must never break a payment.
 */
export const notifyOrderPayment = (order: any, paymentStatus: string): void => {
    const COPY: Record<string, { title: string; message: (ref: string, total: number) => string }> = {
        paid: {
            title: 'Payment received',
            message: (ref, total) => `We have received your ৳${total} payment for order ${ref}. Thank you!`,
        },
        failed: {
            title: 'Payment failed',
            message: (ref) => `Your payment for order ${ref} did not go through. You can retry it from My Orders.`,
        },
        refunded: {
            title: 'Payment refunded',
            message: (ref, total) => `৳${total} for order ${ref} has been refunded.`,
        },
    };
    const copy = COPY[paymentStatus];
    if (!copy || !order?.user) return;

    try {
        const { NotificationService } = require('../notification/notification.service');
        const orderIdStr = order._id.toString();
        NotificationService.notify({
            user: order.user,
            type: 'payment_' + paymentStatus,
            title: copy.title,
            message: copy.message(order.orderId || orderIdStr, order.total || 0),
            link: '/dashboard/user/orders/' + orderIdStr,
            meta: { orderId: orderIdStr, paymentStatus, total: order.total },
        }).catch(() => {});
    } catch {
        // never block the payment flow on a notification failure
    }
};

const OrderService = {
    async getAllOrders(query: Record<string, unknown>) {
        // The admin list sends `search` for order-number lookups, but QueryBuilder.search()
        // reads `searchTerm` — normalise so the admin "search by order number" box works.
        const normalizedQuery = { ...query };
        if (normalizedQuery.search && !normalizedQuery.searchTerm) {
            normalizedQuery.searchTerm = normalizedQuery.search;
        }

        const orderQuery = new QueryBuilder(
            Order.find().populate('user', 'firstName lastName email phone').populate('items.product', 'name thumbnail'),
            normalizedQuery
        )
            .search(['orderId'])   // enable admin order-list search by human order id (SKS-XXXX)
            .filter()              // status tabs (?status=shipped, etc.)
            .sort()
            .paginate();

        const orders = await orderQuery.modelQuery;
        const meta = await orderQuery.countTotal();
        return { orders, meta };
    },

    async getMyOrders(userId: string, query: Record<string, unknown>) {
        // The client sends `search` for order-number lookups, but QueryBuilder.search()
        // reads `searchTerm` — normalise so the "Search by order number" box works.
        const normalizedQuery = { ...query };
        if (normalizedQuery.search && !normalizedQuery.searchTerm) {
            normalizedQuery.searchTerm = normalizedQuery.search;
        }

        const orderQuery = new QueryBuilder(
            Order.find({ user: userId }).populate('items.product', 'name thumbnail slug'),
            normalizedQuery
        )
            .search(['orderId'])   // enable "My Orders" search by human order id (SKS-XXXX)
            .filter()              // enable the status tabs (?status=shipped, etc.)
            .sort()
            .paginate();

        const orders = await orderQuery.modelQuery;
        const meta = await orderQuery.countTotal();
        return { orders, meta };
    },

    async getOrderById(id: string, userId?: string) {
        const filter: any = { _id: id };
        if (userId) filter.user = userId; // non-admin can only see their own

        const order = await Order.findOne(filter)
            .populate('user', 'firstName lastName email phone')
            .populate('items.product', 'name thumbnail slug price');
        if (!order) throw new AppError(404, 'Order not found');
        return order;
    },

    async createOrder(userId: string, payload: any) {
        const { items, shippingAddress, paymentMethod, paymentDetails, couponCode, couponCodes, note } = payload;

        // Guard: an order must contain at least one item (defense-in-depth —
        // the guest-checkout route also validates, but any caller is protected here).
        if (!Array.isArray(items) || items.length === 0) {
            throw new AppError(400, 'Your order must contain at least one item');
        }

        // Get product details and calculate totals
        let subtotal = 0;
        const orderItems: any[] = [];
        const stagedItems: any[] = [];

        // Resolve effective unit price, cost, and thumbnail for an item.
        // If variant (color/size) is chosen, resolve from product.variants.
        // If no variant is chosen (or deselected), resolve from product's base prices.
        const resolveEffectivePrice = (product: any, item?: any): { price: number; cost: number; thumbnail?: string } => {
            if (product.variants && Array.isArray(product.variants) && product.variants.length > 0 && (item?.color || item?.size)) {
                const matchedVariant = product.variants.find((v: any) =>
                    (!item.color || v.color === item.color) &&
                    (!item.size || v.size === item.size || v.label === item.size)
                );
                if (matchedVariant && typeof matchedVariant.price === 'number') {
                    return {
                        price: matchedVariant.price,
                        cost: matchedVariant.wholesalePrice || product.wholesalePrice || product.costPrice || 0,
                        thumbnail: (matchedVariant.images && matchedVariant.images[0]) || product.thumbnail,
                    };
                }
            }

            const basePrice = typeof product.price === 'number' ? product.price : (product.originalPrice || 0);
            return {
                price: basePrice,
                cost: product.wholesalePrice || product.costPrice || 0,
                thumbnail: product.thumbnail,
            };
        };

        for (const item of items) {
            const product = await Product.findOne({ _id: item.product, isDeleted: false, status: 'active' });
            if (!product) throw new AppError(404, `Product not found: ${item.product}`);

            const resolved = resolveEffectivePrice(product, item);
            const unitPrice = resolved.price;
            const itemTotal = unitPrice * item.quantity;
            subtotal += itemTotal;

            orderItems.push({
                product: product._id,
                name: product.name,
                thumbnail: resolved.thumbnail || product.thumbnail,
                price: unitPrice,
                cost: resolved.cost,   // snapshot buying price for COGS/profit
                quantity: item.quantity,
                total: itemTotal,
                color: item.color || '',
                size: item.size || '',
            });
            stagedItems.push({ product });
        }

        // ── Apply coupons (percentage / fixed / free_shipping) — supports stacking ──
        // Accepts either couponCodes[] (multiple, stacked) or a single couponCode
        // (legacy). Each coupon is independently validated (active, not expired,
        // usage limit, min-order, scope) and its discount summed; at most one
        // free-shipping coupon takes effect; the total is capped at the subtotal.
        let discount = 0;
        let couponFreeShipping = false;
        const appliedCoupons: any[] = [];
        const appliedCodes: string[] = [];

        const rawCodes: string[] = Array.isArray(couponCodes) && couponCodes.length
            ? couponCodes
            : (couponCode ? [couponCode] : []);
        const codes = Array.from(
            new Set(rawCodes.map((c: string) => String(c || '').toUpperCase().trim()).filter(Boolean)),
        ).slice(0, 5); // hard cap: never stack more than 5 on one order

        if (codes.length > 0) {
            // Scope-aware line items (built once, reused for every coupon).
            const couponLineItems = orderItems.map((oi: any, idx: number) => ({
                productId: String(oi.product),
                categoryId: stagedItems[idx]?.product?.category ? String(stagedItems[idx].product.category) : null,
                lineTotal: oi.total,
            }));

            for (const code of codes) {
                const coupon = await Coupon.findOne({ code, isActive: true });
                const usable = coupon && coupon.expiresAt > new Date()
                    && (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit)
                    && subtotal >= (coupon.minOrderAmount || 0);
                if (!usable || !coupon) continue;

                const eligibleAmount = getEligibleAmount(coupon, couponLineItems);
                // Skip a scoped coupon that covers none of this order's items.
                if (coupon.applicableTo !== 'all' && eligibleAmount <= 0) continue;

                if (coupon.discountType === 'free_shipping') {
                    couponFreeShipping = true;
                } else {
                    discount += computeCouponDiscount(coupon, eligibleAmount);
                }
                appliedCoupons.push(coupon);
                appliedCodes.push(coupon.code);
            }
        }

        // Authoritative server-side shipping charge (never trust a client-sent value).
        // Free shipping resolves via: all-items-free-delivery → coupon → subtotal
        // threshold → quantity → zone rate.
        const { shippingCost, freeReason } = await computeShippingCost({
            district: shippingAddress?.district || '',
            city: shippingAddress?.district || shippingAddress?.city || '',
            subtotal,
            items: stagedItems.map((s: any) => ({ freeShipping: Boolean(s.product?.shippingConfig?.freeShipping) })),
            totalQuantity: orderItems.reduce((n: number, oi: any) => n + (oi.quantity || 0), 0),
            couponFreeShipping,
        });
        // Guard: a fixed/large coupon can't discount more than the order subtotal
        discount = Math.min(discount, subtotal);
        const total = subtotal - discount + shippingCost;

        // Create order
        const order = await Order.create({
            user: userId,
            items: orderItems,
            shippingAddress,
            subtotal,
            shippingCost,
            shippingFreeReason: freeReason || '',
            discount,
            total,
            couponCode: appliedCodes[0] || '',
            couponCodes: appliedCodes,
            paymentMethod,
            paymentDetails: paymentDetails || {},
            transactionId: paymentDetails?.transactionId || '',
            note: note || '',
            timeline: [{ status: 'pending', note: 'Order placed successfully' }],
        });

        // Count usage for every applied coupon (so each usageLimit is enforced).
        if (appliedCoupons.length > 0) {
            await Coupon.updateMany(
                { _id: { $in: appliedCoupons.map((c) => c._id) } },
                { $inc: { usedCount: 1 } },
            );
        }

        // Update stock and product sold count
        for (const item of orderItems) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity, totalSold: item.quantity },
            });
        }

        // Update user stats
        await User.findByIdAndUpdate(userId, { $inc: { totalOrders: 1, totalSpent: total } });

        // Live-refresh admin dashboards (new order affects order counts + pipeline).
        emitFinanceUpdate('order_placed');

        // Send WhatsApp notification to admin (fire & forget)
        const user = await User.findById(userId);
        notifyOrderToWhatsApp({
            orderNumber: order.orderId || order._id.toString(),
            customerName: shippingAddress.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
            customerPhone: shippingAddress.phone || user?.phone || '',
            address: shippingAddress.address || '',
            items: orderItems.map(i => ({ name: i.name, quantity: i.quantity, price: i.price, color: i.color, size: i.size })),
            total,
            note: note || '',
        }).catch(() => {}); // never block order flow

        // Auto-send invoice email (fire & forget; lazy require avoids circular import)
        try {
            const { default: InvoiceService } = require('../invoice/invoice.service');
            InvoiceService.emailInvoiceToCustomer(order._id.toString()).catch(() => {});
        } catch {
            // never block order flow
        }

        // ── In-app notifications: customer + all admins ──
        // Fire-and-forget: any failure here must NEVER break order placement.
        try {
            const { NotificationService } = require('../notification/notification.service');
            const orderIdStr = order._id.toString();

            const fanOut = async () => {
                // 1) Customer — order placed confirmation
                await NotificationService.notify({
                    user: userId,
                    type: 'order_placed',
                    title: 'Order placed',
                    message: `Your order ${order.orderId || orderIdStr} has been placed successfully.`,
                    link: '/dashboard/user/orders/' + orderIdStr,
                    meta: { orderId: orderIdStr, total },
                });

                // 2) Every admin / superadmin
                await NotificationService.notifyAdmins({
                    type: 'new_order',
                    title: 'New order placed',
                    message: `A new order ${order.orderId || orderIdStr} was placed (৳${total}).`,
                    link: '/dashboard/admin/orders/' + orderIdStr,
                    meta: { orderId: orderIdStr, total },
                });
            };

            fanOut().catch(() => {});
        } catch {
            // never block order flow
        }

        return order;
    },

    // ── Guest checkout: auto-create user + place order ────────────────
    async createGuestOrder(payload: any) {
        const { shippingAddress, password } = payload;
        const { fullName, email, phone } = shippingAddress;

        if (!phone || !fullName) {
            throw new AppError(400, 'Full name and phone number are required for checkout');
        }

        // Auto-generate guest email from phone if not provided
        const guestEmail = email || `${phone.replace(/\s+/g, '')}@guest.bichitrapoint.com`;

        // Check if user already exists
        let user = await User.findOne({ $or: [{ email: guestEmail.toLowerCase() }, { phone }] });
        let isNewUser = false;

        if (!user) {
            // Auto-create account: phone number as password
            const nameParts = fullName.trim().split(' ');
            const firstName = nameParts[0] || 'Customer';
            const lastName = nameParts.slice(1).join(' ') || '.';

            user = await User.create({
                email: guestEmail.toLowerCase(),
                password: password || phone,   // matches the "your phone number is your password" message
                firstName,
                lastName,
                phone,
                role: 'user',
                status: 'active',
                isEmailVerified: false,
            });
            isNewUser = true;
        }

        // Now create order using the existing createOrder method
        const order = await this.createOrder(user._id!.toString(), payload);

        // Generate token for auto-login
        const jwt = require('jsonwebtoken');
        const appConfig = require('../../config').default;
        const accessToken = jwt.sign(
            { userId: user._id!.toString(), email: user.email, role: user.role },
            appConfig.jwt.access_secret,
            { expiresIn: appConfig.jwt.access_expires_in }
        );

        return {
            order,
            user: {
                _id: user._id!.toString(),
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                phone: user.phone,
            },
            accessToken,
            isNewUser,
        };
    },

    async updateOrderStatus(id: string, status: string, note?: string) {
        const order = await Order.findById(id);
        if (!order) throw new AppError(404, 'Order not found');

        order.status = status as any;
        order.timeline.push({ status, note: note || '', createdAt: new Date() } as any);

        // Update payment status when delivered (COD collected on delivery)
        if (status === 'delivered' && order.paymentMethod === 'cod') {
            order.paymentStatus = 'paid';
        }
        // Refund flips the payment status to refunded
        if (status === 'refunded') {
            order.paymentStatus = 'refunded';
        }

        await order.save();
        // Status/payment change can move revenue & net profit — refresh admins live.
        emitFinanceUpdate('order_status:' + status);

        // ── Notify the customer of the status change (fire-and-forget) ──
        try {
            const { NotificationService } = require('../notification/notification.service');
            const orderIdStr = order._id.toString();
            NotificationService.notify({
                user: order.user.toString(),
                type: 'order_status',
                title: 'Order status updated',
                message: `Your order ${order.orderId || orderIdStr} is now "${status}".`,
                link: '/dashboard/user/orders/' + orderIdStr,
                meta: { orderId: orderIdStr, status },
            }).catch(() => {});
        } catch {
            // never block status update
        }

        return order;
    },

    async updateOrderItems(id: string, payload: any) {
        const order = await Order.findById(id);
        if (!order) throw new AppError(404, 'Order not found');

        const { items, discount, shippingCost } = payload;
        if (!Array.isArray(items) || items.length === 0) {
            throw new AppError(400, 'Order must contain at least one item');
        }

        let subtotal = 0;
        const newOrderItems = items.map((item: any) => {
            const qty = Math.max(1, Number(item.quantity) || 1);
            const price = Math.max(0, Number(item.price) || 0);
            const total = qty * price;
            subtotal += total;

            return {
                product: item.product?._id || item.product,
                name: item.name,
                thumbnail: item.thumbnail || '',
                price,
                cost: Number(item.cost) || 0,
                quantity: qty,
                total,
                color: item.color || '',
                size: item.size || '',
            };
        });

        order.items = newOrderItems as any;
        order.subtotal = subtotal;

        if (discount !== undefined) {
            order.discount = Math.max(0, Number(discount) || 0);
        }
        if (shippingCost !== undefined) {
            order.shippingCost = Math.max(0, Number(shippingCost) || 0);
        }

        order.total = Math.max(0, order.subtotal - (order.discount || 0) + (order.shippingCost || 0));

        order.timeline.push({
            status: order.status,
            note: 'Order items and quantities updated by admin',
            createdAt: new Date(),
        } as any);

        await order.save();
        return order;
    },

    async cancelOrder(id: string, userId: string) {
        const order = await Order.findOne({ _id: id, user: userId });
        if (!order) throw new AppError(404, 'Order not found');
        if (!['pending', 'confirmed'].includes(order.status)) {
            throw new AppError(400, 'Order cannot be cancelled at this stage');
        }

        order.status = 'cancelled';
        order.timeline.push({ status: 'cancelled', note: 'Cancelled by user', createdAt: new Date() } as any);

        await order.save();

        // Restore stock
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
        }

        // Tell the admins straight away — otherwise they keep packing an order
        // the customer has already cancelled. Fire-and-forget.
        try {
            const { NotificationService } = require('../notification/notification.service');
            const orderIdStr = order._id.toString();
            NotificationService.notifyAdmins({
                type: 'order_cancelled',
                title: 'Order cancelled by customer',
                message: `Order ${order.orderId || orderIdStr} was cancelled by the customer (৳${order.total}).`,
                link: '/dashboard/admin/orders/' + orderIdStr,
                meta: { orderId: orderIdStr, total: order.total },
            }).catch(() => {});
        } catch {
            // never block the cancellation
        }
        emitFinanceUpdate('order_cancelled');

        return order;
    },

    async updatePaymentStatus(id: string, paymentStatus: string) {
        const order = await Order.findById(id);
        if (!order) throw new AppError(404, 'Order not found');

        order.paymentStatus = paymentStatus as any;
        if (paymentStatus === 'paid') {
            order.transactionId = order.transactionId || `PAY-${Date.now()}`;
        }
        order.timeline.push({ status: `payment_${paymentStatus}`, note: `Payment marked as ${paymentStatus}`, createdAt: new Date() } as any);
        await order.save();
        emitFinanceUpdate('payment_status:' + paymentStatus);

        // Tell the customer — their money moved, they should hear about it.
        notifyOrderPayment(order, paymentStatus);
        return order;
    },

    async addAdminNote(id: string, note: string) {
        const order = await Order.findById(id);
        if (!order) throw new AppError(404, 'Order not found');

        // Persist the current note so the admin detail page can read it back
        // (order.adminNote), and keep a timeline trail of every note added.
        order.adminNote = note;
        order.timeline.push({ status: 'admin_note', note, createdAt: new Date() } as any);
        await order.save();
        return order;
    },

    async getOrderStats() {
        const [total, pending, confirmed, processing, shipped, on_the_way, out_for_delivery, delivery_attempt, delivered, cancelled, returned, refunded] = await Promise.all([
            Order.countDocuments(),
            Order.countDocuments({ status: 'pending' }),
            Order.countDocuments({ status: 'confirmed' }),
            Order.countDocuments({ status: 'processing' }),
            Order.countDocuments({ status: 'shipped' }),
            Order.countDocuments({ status: 'on_the_way' }),
            Order.countDocuments({ status: 'out_for_delivery' }),
            Order.countDocuments({ status: 'delivery_attempt' }),
            Order.countDocuments({ status: 'delivered' }),
            Order.countDocuments({ status: 'cancelled' }),
            Order.countDocuments({ status: 'returned' }),
            Order.countDocuments({ status: 'refunded' }),
        ]);

        const revenueData = await Order.aggregate([
            { $match: { status: 'delivered' } },
            { $group: { _id: null, totalRevenue: { $sum: '$total' } } },
        ]);

        return { total, pending, confirmed, processing, shipped, on_the_way, out_for_delivery, delivery_attempt, delivered, cancelled, returned, refunded, totalRevenue: revenueData[0]?.totalRevenue || 0 };
    },

    // ════════════════════════════════════════════════════════════
    //  RETURN / REFUND (called from the return module)
    // ════════════════════════════════════════════════════════════

    // Mark an order as returned, then set order status.
    async markOrderReturned(orderId: any, note?: string) {
        const order = await Order.findById(orderId);
        if (!order) throw new AppError(404, 'Order not found');

        if (order.status !== 'returned' && order.status !== 'refunded') {
            order.status = 'returned' as any;
            order.timeline.push({ status: 'returned', note: note || 'Return approved', createdAt: new Date() } as any);
            await order.save();
        }
        return order;
    },

    // Mark an order as refunded + flip payment status.
    async markOrderRefunded(orderId: any, note?: string) {
        const order = await Order.findById(orderId);
        if (!order) throw new AppError(404, 'Order not found');

        order.paymentStatus = 'refunded';
        if (order.status !== 'refunded') {
            order.status = 'refunded' as any;
            order.timeline.push({ status: 'refunded', note: note || 'Refund processed', createdAt: new Date() } as any);
        }
        await order.save();
        return order;
    },

    // ════════════════════════════════════════════════════════════
    //  TRACKING (admin set) + PUBLIC TRACK
    // ════════════════════════════════════════════════════════════

    // Admin sets the order tracking number + carrier
    async updateOrderTracking(id: string, trackingNumber: string, carrier: string) {
        const order = await Order.findById(id);
        if (!order) throw new AppError(404, 'Order not found');

        order.trackingNumber = trackingNumber;
        order.carrier = carrier;
        order.timeline.push({
            status: 'tracking_updated',
            note: `Tracking: ${trackingNumber} via ${carrier}`,
            createdAt: new Date(),
        } as any);

        await order.save();
        return order;
    },

    // Public order tracking — matches human orderId (case-insensitive) OR Mongo _id
    async trackOrder(orderId: string): Promise<any> {
        const escaped = orderId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const or: any[] = [{ orderId: new RegExp('^' + escaped + '$', 'i') }];
        if (Types.ObjectId.isValid(orderId)) or.push({ _id: orderId });

        const order = await Order.findOne({ $or: or });
        if (!order) throw new AppError(404, 'Order not found');

        const o: any = order;
        const itemsCount = (o.items || []).reduce((sum: number, it: any) => sum + (it.quantity || 0), 0);
        const customerName = (o.shippingAddress?.fullName || '').trim().split(/\s+/)[0] || '';

        return {
            orderId: o.orderId,
            status: o.status,
            paymentStatus: o.paymentStatus,
            paymentMethod: o.paymentMethod,
            createdAt: o.createdAt,
            customerName,
            itemsCount,
            trackingNumber: o.trackingNumber || '',
            carrier: o.carrier || '',
            courierStatus: o.courierStatus || '',   // raw courier state (e.g. hub transit) for the tracker
            timeline: (o.timeline || []).map((t: any) => ({ status: t.status, note: t.note, createdAt: t.createdAt })),
        };
    },
};

export default OrderService;
