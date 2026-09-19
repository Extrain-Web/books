import { Schema, model, Document, Types } from 'mongoose';

export interface IWholesaleOrderItem {
    product: Types.ObjectId;
    name: string;
    sku?: string;
    thumbnail?: string;
    variantLabel?: string;
    quantity: number;
    unitPrice: number;
    retailPrice: number;
    total: number;
}

export interface IWholesaleCustomerSnapshot {
    businessName: string;
    contactName?: string;
    phone: string;
    email?: string;
    address: string;
    city?: string;
    customerType?: string;
}

export interface IWholesaleOrder extends Document {
    invoiceNumber: string;
    customer: Types.ObjectId;
    customerSnapshot: IWholesaleCustomerSnapshot;
    items: IWholesaleOrderItem[];
    subtotal: number;
    discount: number;
    deliveryCharge: number;
    grandTotal: number;
    paidAmount: number;
    dueAmount: number;
    previousDue: number;
    paymentStatus: 'paid' | 'partial' | 'unpaid';
    orderStatus: 'confirmed' | 'processing' | 'delivered' | 'cancelled';
    paymentMethod: 'cash' | 'bank_transfer' | 'bkash' | 'nagad' | 'cheque' | 'credit' | 'other';
    paymentTerms: string;
    returnPolicy: string;
    notes: string;
    orderDate: Date;
    dueDate?: Date;
    createdAdmin?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const wholesaleOrderItemSchema = new Schema(
    {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        sku: { type: String, default: '' },
        thumbnail: { type: String, default: '' },
        variantLabel: { type: String, default: '' },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        retailPrice: { type: Number, default: 0 },
        total: { type: Number, required: true, min: 0 },
    },
    { _id: true }
);

const customerSnapshotSchema = new Schema(
    {
        businessName: { type: String, required: true },
        contactName: { type: String, default: '' },
        phone: { type: String, required: true },
        email: { type: String, default: '' },
        address: { type: String, required: true },
        city: { type: String, default: '' },
        customerType: { type: String, default: 'Book Shop' },
    },
    { _id: false }
);

const wholesaleOrderSchema = new Schema<IWholesaleOrder>(
    {
        invoiceNumber: {
            type: String,
            unique: true,
            required: true,
            trim: true,
        },
        customer: {
            type: Schema.Types.ObjectId,
            ref: 'WholesaleCustomer',
            required: true,
        },
        customerSnapshot: {
            type: customerSnapshotSchema,
            required: true,
        },
        items: {
            type: [wholesaleOrderItemSchema],
            required: true,
            validate: [(val: any[]) => val.length > 0, 'Wholesale order must contain at least one item'],
        },
        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },
        discount: {
            type: Number,
            default: 0,
            min: 0,
        },
        deliveryCharge: {
            type: Number,
            default: 0,
            min: 0,
        },
        grandTotal: {
            type: Number,
            required: true,
            min: 0,
        },
        paidAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        dueAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        previousDue: {
            type: Number,
            default: 0,
            min: 0,
        },
        paymentStatus: {
            type: String,
            enum: ['paid', 'partial', 'unpaid'],
            default: 'unpaid',
        },
        orderStatus: {
            type: String,
            enum: ['confirmed', 'processing', 'delivered', 'cancelled'],
            default: 'confirmed',
        },
        paymentMethod: {
            type: String,
            enum: ['cash', 'bank_transfer', 'bkash', 'nagad', 'cheque', 'credit', 'other'],
            default: 'cash',
        },
        paymentTerms: {
            type: String,
            default: 'Payment due within 15 days of invoice date.',
        },
        returnPolicy: {
            type: String,
            default: 'Damaged or defective goods must be notified within 48 hours of delivery.',
        },
        notes: {
            type: String,
            default: '',
        },
        orderDate: {
            type: Date,
            default: Date.now,
        },
        dueDate: {
            type: Date,
            default: null,
        },
        createdAdmin: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
    }
);

// ── Indexes for query performance and scale ────────────────────────
wholesaleOrderSchema.index({ invoiceNumber: 1 }, { unique: true });
wholesaleOrderSchema.index({ customer: 1 });
wholesaleOrderSchema.index({ paymentStatus: 1 });
wholesaleOrderSchema.index({ orderStatus: 1 });
wholesaleOrderSchema.index({ orderDate: -1 });
wholesaleOrderSchema.index({ createdAt: -1 });
wholesaleOrderSchema.index({ dueAmount: -1 });

export const WholesaleOrder = model<IWholesaleOrder>('WholesaleOrder', wholesaleOrderSchema);
