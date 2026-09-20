import { Schema, model } from 'mongoose';

const inquirySchema = new Schema(
    {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: false, default: null },
        name: { type: String, required: true, maxlength: 100, trim: true },
        email: { type: String, default: '', trim: true },
        phone: { type: String, default: '', maxlength: 100, trim: true },
        subject: { type: String, default: '', maxlength: 200, trim: true },
        message: { type: String, required: true, maxlength: 2000, trim: true },
        status: { type: String, enum: ['pending', 'read', 'replied', 'resolved', 'closed'], default: 'pending' },
        adminReply: { type: String, default: '' },
    },
    { timestamps: true, toJSON: { virtuals: true } }
);

inquirySchema.index({ product: 1, createdAt: -1 });
inquirySchema.index({ status: 1, createdAt: -1 });

export const Inquiry = model('Inquiry', inquirySchema);

