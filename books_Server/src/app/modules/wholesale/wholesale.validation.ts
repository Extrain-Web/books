import { z } from 'zod';

export const createWholesaleCustomerValidation = z.object({
    body: z.object({
        businessName: z.string({ required_error: 'Business / Customer Name is required' }).min(2, 'Name must be at least 2 characters'),
        contactName: z.string().optional(),
        phone: z.string({ required_error: 'Phone number is required' }).min(6, 'Invalid phone number'),
        email: z.string().email('Invalid email address').optional().or(z.literal('')),
        address: z.string({ required_error: 'Address is required' }).min(2, 'Address is required'),
        city: z.string().optional(),
        customerType: z.enum(['Book Shop', 'School', 'Madrasah', 'Retailer', 'Distributor', 'Corporate', 'Other']).optional(),
        openingBalance: z.number().optional(),
        notes: z.string().optional(),
    }),
});

export const updateWholesaleCustomerValidation = z.object({
    body: z.object({
        businessName: z.string().min(2).optional(),
        contactName: z.string().optional(),
        phone: z.string().min(6).optional(),
        email: z.string().email().optional().or(z.literal('')),
        address: z.string().min(2).optional(),
        city: z.string().optional(),
        customerType: z.enum(['Book Shop', 'School', 'Madrasah', 'Retailer', 'Distributor', 'Corporate', 'Other']).optional(),
        openingBalance: z.number().optional(),
        currentDue: z.number().optional(),
        totalPaid: z.number().optional(),
        notes: z.string().optional(),
        isActive: z.boolean().optional(),
    }),
});

export const createWholesaleOrderValidation = z.object({
    body: z.object({
        customerId: z.string({ required_error: 'Customer ID is required' }),
        items: z.array(
            z.object({
                product: z.string({ required_error: 'Product ID is required' }),
                name: z.string({ required_error: 'Product name is required' }),
                sku: z.string().optional(),
                thumbnail: z.string().optional(),
                variantLabel: z.string().optional(),
                quantity: z.number().min(1, 'Quantity must be at least 1'),
                unitPrice: z.number().min(0, 'Unit price must be positive'),
                retailPrice: z.number().min(0).optional(),
            })
        ).min(1, 'At least one item is required'),
        discount: z.number().min(0).optional(),
        deliveryCharge: z.number().min(0).optional(),
        paidAmount: z.number().min(0).optional(),
        previousDue: z.number().optional(),
        paymentMethod: z.enum(['cash', 'bank_transfer', 'bkash', 'nagad', 'cheque', 'credit', 'other']).optional(),
        paymentTerms: z.string().optional(),
        returnPolicy: z.string().optional(),
        notes: z.string().optional(),
        orderDate: z.string().or(z.date()).optional(),
        dueDate: z.string().or(z.date()).optional().nullable(),
    }),
});

export const updateWholesaleOrderValidation = z.object({
    body: z.object({
        orderStatus: z.enum(['confirmed', 'processing', 'delivered', 'cancelled']).optional(),
        items: z.array(
            z.object({
                product: z.string({ required_error: 'Product ID is required' }),
                name: z.string({ required_error: 'Product name is required' }),
                sku: z.string().optional(),
                thumbnail: z.string().optional(),
                variantLabel: z.string().optional(),
                quantity: z.number().min(1, 'Quantity must be at least 1'),
                unitPrice: z.number().min(0, 'Unit price must be positive'),
                retailPrice: z.number().min(0).optional(),
                total: z.number().optional(),
            })
        ).min(1, 'At least one item is required').optional(),
        paidAmount: z.number().min(0).optional(),
        previousDue: z.number().optional(),
        paymentStatus: z.enum(['paid', 'partial', 'unpaid']).optional(),
        paymentMethod: z.enum(['cash', 'bank_transfer', 'bkash', 'nagad', 'cheque', 'credit', 'other']).optional(),
        discount: z.number().min(0).optional(),
        deliveryCharge: z.number().min(0).optional(),
        notes: z.string().optional(),
        paymentTerms: z.string().optional(),
        returnPolicy: z.string().optional(),
        dueDate: z.string().or(z.date()).optional().nullable(),
    }),
});
