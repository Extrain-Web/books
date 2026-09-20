import { Schema, model } from 'mongoose';
import { IChatMessage, IChatSession } from './chat.interface';

const chatActionSchema = new Schema(
    {
        label: { type: String, required: true },
        href: { type: String, default: '' },
        topic: { type: String, default: '' },
    },
    { _id: false }
);

const chatMessageSchema = new Schema<IChatMessage>(
    {
        sender: { type: String, enum: ['user', 'admin', 'bot'], required: true },
        senderName: { type: String, default: 'Visitor' },
        senderId: { type: Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, required: true },
        actions: [chatActionSchema],
        readByAdmin: { type: Boolean, default: false },
        readByUser: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const chatSessionSchema = new Schema<IChatSession>(
    {
        sessionId: { type: String, required: true, unique: true, index: true },
        user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
        customerName: { type: String, default: 'Visitor' },
        customerPhone: { type: String, default: '' },
        customerEmail: { type: String, default: '' },
        messages: [chatMessageSchema],
        lastMessage: { type: String, default: '' },
        lastMessageSender: { type: String, enum: ['user', 'admin', 'bot'], default: 'user' },
        lastMessageAt: { type: Date, default: Date.now, index: true },
        unreadAdminCount: { type: Number, default: 0 },
        unreadUserCount: { type: Number, default: 0 },
        status: { type: String, enum: ['active', 'resolved', 'archived'], default: 'active', index: true },
        assignedAdmin: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

chatSessionSchema.index({ lastMessageAt: -1 });
chatSessionSchema.index({ status: 1, lastMessageAt: -1 });

export const ChatSession = model<IChatSession>('ChatSession', chatSessionSchema);
