import { Schema, model, Document } from 'mongoose';

export interface IWholesaleCustomer extends Document {
    businessName: string;
    contactName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    customerType: 'Book Shop' | 'School' | 'Madrasah' | 'Retailer' | 'Distributor' | 'Corporate' | 'Other';
    openingBalance: number;
    totalOrders: number;
    totalBilled: number;
    totalPaid: number;
    currentDue: number;
    notes: string;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const wholesaleCustomerSchema = new Schema<IWholesaleCustomer>(
    {
        businessName: {
            type: String,
            required: [true, 'Customer or Business Name is required'],
            trim: true,
            maxlength: 200,
        },
        contactName: {
            type: String,
            trim: true,
            default: '',
            maxlength: 100,
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: '',
        },
        address: {
            type: String,
            required: [true, 'Address is required'],
            trim: true,
        },
        city: {
            type: String,
            trim: true,
            default: 'Dhaka',
        },
        customerType: {
            type: String,
            enum: ['Book Shop', 'School', 'Madrasah', 'Retailer', 'Distributor', 'Corporate', 'Other'],
            default: 'Book Shop',
        },
        openingBalance: {
            type: Number,
            default: 0,
        },
        totalOrders: {
            type: Number,
            default: 0,
        },
        totalBilled: {
            type: Number,
            default: 0,
        },
        totalPaid: {
            type: Number,
            default: 0,
        },
        currentDue: {
            type: Number,
            default: 0,
        },
        notes: {
            type: String,
            default: '',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
    }
);

// ── Indexes for high-performance searching and filtering ──────────
wholesaleCustomerSchema.index({ phone: 1 });
wholesaleCustomerSchema.index({ businessName: 1 });
wholesaleCustomerSchema.index({ customerType: 1 });
wholesaleCustomerSchema.index({ isActive: 1, isDeleted: 1 });
wholesaleCustomerSchema.index({ currentDue: -1 });

export const WholesaleCustomer = model<IWholesaleCustomer>('WholesaleCustomer', wholesaleCustomerSchema);
