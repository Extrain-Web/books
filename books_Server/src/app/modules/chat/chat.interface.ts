import { Types } from 'mongoose';

export type ChatSenderType = 'user' | 'admin' | 'bot';

export interface IChatAction {
    label: string;
    href?: string;
    topic?: string;
}

export interface IChatMessage {
    _id?: Types.ObjectId;
    sender: ChatSenderType;
    senderName: string;
    senderId?: Types.ObjectId;
    text: string;
    actions?: IChatAction[];
    createdAt?: Date;
    readByAdmin?: boolean;
    readByUser?: boolean;
}

export type ChatSessionStatus = 'active' | 'resolved' | 'archived';

export interface IChatSession {
    _id?: Types.ObjectId;
    sessionId: string; // Persistent client session identifier
    user?: Types.ObjectId; // User ID if logged in
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    messages: IChatMessage[];
    lastMessage: string;
    lastMessageSender: ChatSenderType;
    lastMessageAt: Date;
    unreadAdminCount: number;
    unreadUserCount: number;
    status: ChatSessionStatus;
    assignedAdmin?: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}
