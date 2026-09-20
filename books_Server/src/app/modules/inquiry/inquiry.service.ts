import { Inquiry } from './inquiry.model';
import { Product } from '../product/product.model';
import { notifyInquiryToWhatsApp } from '../../utils/whatsappNotify';

const InquiryService = {
    create: async (data: any) => {
        const inquiry = await Inquiry.create(data);

        // Send WhatsApp notification to admin (fire & forget)
        let productName = data.subject || 'General Contact Message';
        if (data.product) {
            try {
                const product = await Product.findById(data.product).select('name');
                if (product) productName = product.name;
            } catch {
                // ignore
            }
        }

        notifyInquiryToWhatsApp({
            customerName: data.name || '',
            customerPhone: data.phone || data.email || '',
            productName: productName,
            message: data.message || '',
            color: data.color || '',
            size: data.size || '',
        }).catch(() => {}); // never block inquiry flow

        // In-app bell notification for admins
        try {
            const { NotificationService } = require('../notification/notification.service');
            NotificationService.notifyAdmins({
                type: 'new_inquiry',
                title: data.subject ? `New Message: ${data.subject}` : 'New Customer Message',
                message: `${data.name || 'A customer'} sent a message: "${(data.message || '').slice(0, 75)}${(data.message || '').length > 75 ? '...' : ''}"`,
                link: '/dashboard/admin/inquiries',
                meta: {
                    inquiryId: inquiry._id.toString(),
                    product: data.product ? String(data.product) : undefined,
                    email: data.email,
                    phone: data.phone,
                },
            }).catch(() => {});
        } catch {
            // never block the inquiry flow
        }

        return inquiry;
    },

    getAll: async (query: Record<string, unknown>) => {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const skip = (page - 1) * limit;
        const filter: any = {};

        if (query.status) filter.status = query.status;
        if (query.product) filter.product = query.product;

        const searchTerm = typeof query.searchTerm === 'string' ? query.searchTerm.trim() : (typeof query.q === 'string' ? query.q.trim() : '');
        if (searchTerm) {
            filter.$or = [
                { name: { $regex: searchTerm, $options: 'i' } },
                { email: { $regex: searchTerm, $options: 'i' } },
                { phone: { $regex: searchTerm, $options: 'i' } },
                { subject: { $regex: searchTerm, $options: 'i' } },
                { message: { $regex: searchTerm, $options: 'i' } },
            ];
        }

        const [inquiries, total] = await Promise.all([
            Inquiry.find(filter)
                .populate('product', 'name slug thumbnail')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Inquiry.countDocuments(filter),
        ]);

        return {
            inquiries,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    },

    getByProduct: async (productId: string) => {
        const inquiries = await Inquiry.find({ product: productId })
            .sort({ createdAt: -1 })
            .limit(50);
        return inquiries;
    },

    updateStatus: async (id: string, data: { status: string; adminReply?: string }) => {
        const inquiry = await Inquiry.findByIdAndUpdate(id, data, { new: true });
        if (!inquiry) throw new Error('Inquiry not found');
        return inquiry;
    },

    delete: async (id: string) => {
        const inquiry = await Inquiry.findByIdAndDelete(id);
        if (!inquiry) throw new Error('Inquiry not found');
        return inquiry;
    },
};

export default InquiryService;

