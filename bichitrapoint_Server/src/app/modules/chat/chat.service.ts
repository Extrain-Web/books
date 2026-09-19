import { ChatSession } from './chat.model';
import { IChatAction, IChatSession, ChatSenderType, ChatSessionStatus } from './chat.interface';
import { Types } from 'mongoose';

export interface SendUserMessagePayload {
    sessionId: string;
    text: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    userId?: string;
    botReply?: {
        text: string;
        actions?: IChatAction[];
    };
}

const ChatService = {
    // ── Customer sends a message (+ instant bot reply if generated) ───────────
    sendMessageFromUser: async (payload: SendUserMessagePayload): Promise<IChatSession> => {
        const { sessionId, text, customerName, customerPhone, customerEmail, userId, botReply } = payload;

        let session = await ChatSession.findOne({ sessionId });

        const userMsg = {
            sender: 'user' as ChatSenderType,
            senderName: customerName || (session?.customerName !== 'Visitor' ? session?.customerName : 'Visitor') || 'Visitor',
            senderId: userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined,
            text,
            createdAt: new Date(),
            readByAdmin: false,
            readByUser: true,
        };

        if (!session) {
            const initialMessages: any[] = [userMsg];
            if (botReply && botReply.text) {
                initialMessages.push({
                    sender: 'bot' as ChatSenderType,
                    senderName: 'Assistant Bot',
                    text: botReply.text,
                    actions: botReply.actions || [],
                    createdAt: new Date(Date.now() + 500),
                    readByAdmin: false,
                    readByUser: true,
                });
            }

            session = await ChatSession.create({
                sessionId,
                user: userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined,
                customerName: customerName || 'Visitor',
                customerPhone: customerPhone || '',
                customerEmail: customerEmail || '',
                messages: initialMessages,
                lastMessage: text,
                lastMessageSender: 'user',
                lastMessageAt: new Date(),
                unreadAdminCount: 1,
                unreadUserCount: 0,
                status: 'active',
            });
        } else {
            session.messages.push(userMsg as any);
            session.unreadAdminCount = (session.unreadAdminCount || 0) + 1;
            session.lastMessage = text;
            session.lastMessageSender = 'user';
            session.lastMessageAt = new Date();
            session.status = 'active';

            if (customerName && session.customerName === 'Visitor') {
                session.customerName = customerName;
            }
            if (customerPhone && !session.customerPhone) {
                session.customerPhone = customerPhone;
            }
            if (customerEmail && !session.customerEmail) {
                session.customerEmail = customerEmail;
            }
            if (userId && !session.user && Types.ObjectId.isValid(userId)) {
                session.user = new Types.ObjectId(userId);
            }

            if (botReply && botReply.text) {
                session.messages.push({
                    sender: 'bot' as ChatSenderType,
                    senderName: 'Assistant Bot',
                    text: botReply.text,
                    actions: botReply.actions || [],
                    createdAt: new Date(Date.now() + 500),
                    readByAdmin: false,
                    readByUser: true,
                } as any);
            }

            await session.save();
        }

        // Notify admins via in-app notification bell (fire & forget)
        try {
            const { NotificationService } = require('../notification/notification.service');
            NotificationService.notifyAdmins({
                type: 'new_chat',
                title: 'New Live Chat Message',
                message: `${customerName || (session?.customerName !== 'Visitor' ? session?.customerName : 'A customer') || 'Visitor'}: "${text.length > 60 ? text.substring(0, 57) + '...' : text}"`,
                link: '/dashboard/admin/chat',
                meta: { sessionId },
            }).catch(() => {});
        } catch {
            // never block
        }

        return session;
    },

    // ── Admin replies to a customer session ─────────────────────────────────
    replyFromAdmin: async (
        sessionId: string,
        adminUser: { _id?: string; name?: string; email?: string },
        text: string
    ): Promise<IChatSession | null> => {
        const session = await ChatSession.findOne({ sessionId });
        if (!session) return null;

        const adminMsg = {
            sender: 'admin' as ChatSenderType,
            senderName: adminUser.name || 'Support Agent',
            senderId: adminUser._id && Types.ObjectId.isValid(adminUser._id) ? new Types.ObjectId(adminUser._id) : undefined,
            text,
            createdAt: new Date(),
            readByAdmin: true,
            readByUser: false,
        };

        session.messages.push(adminMsg as any);
        session.unreadUserCount = (session.unreadUserCount || 0) + 1;
        session.unreadAdminCount = 0; // Admin replied, mark unread count 0
        session.lastMessage = text;
        session.lastMessageSender = 'admin';
        session.lastMessageAt = new Date();
        session.status = 'active';

        await session.save();
        return session;
    },

    // ── Get conversation by Session ID (used by both client and admin) ───────
    getConversationBySession: async (
        sessionId: string,
        viewerRole: 'admin' | 'user' = 'user',
        markAsRead = false
    ): Promise<IChatSession | null> => {
        let session = await ChatSession.findOne({ sessionId }).populate('user', 'name email phone avatar');

        if (!session) return null;

        if (viewerRole === 'admin' && session.unreadAdminCount > 0) {
            session.unreadAdminCount = 0;
            session.messages.forEach(m => { m.readByAdmin = true; });
            await session.save();
        } else if (viewerRole === 'user' && markAsRead && session.unreadUserCount > 0) {
            session.unreadUserCount = 0;
            session.messages.forEach(m => { m.readByUser = true; });
            await session.save();
        }

        return session;
    },

    // ── Get all conversations with filters & search (for admin panel) ────────
    getAllConversations: async (query: Record<string, any>) => {
        const { searchTerm, status, page = 1, limit = 20 } = query;

        const pageNum = Math.max(1, Number(page) || 1);
        const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
        const skip = (pageNum - 1) * limitNum;

        const filter: Record<string, any> = {};

        if (status && status !== 'all') {
            filter.status = status;
        }

        if (searchTerm) {
            filter.$or = [
                { customerName: { $regex: searchTerm, $options: 'i' } },
                { customerPhone: { $regex: searchTerm, $options: 'i' } },
                { customerEmail: { $regex: searchTerm, $options: 'i' } },
                { sessionId: { $regex: searchTerm, $options: 'i' } },
                { lastMessage: { $regex: searchTerm, $options: 'i' } },
            ];
        }

        const [conversations, total, totalUnread, activeCount, resolvedCount] = await Promise.all([
            ChatSession.find(filter)
                .populate('user', 'name email phone avatar')
                .sort({ lastMessageAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            ChatSession.countDocuments(filter),
            ChatSession.countDocuments({ unreadAdminCount: { $gt: 0 } }),
            ChatSession.countDocuments({ status: 'active' }),
            ChatSession.countDocuments({ status: 'resolved' }),
        ]);

        return {
            conversations,
            stats: {
                total,
                unread: totalUnread,
                active: activeCount,
                resolved: resolvedCount,
            },
            meta: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum) || 1,
            },
        };
    },

    // ── Update conversation status ──────────────────────────────────────────
    updateStatus: async (sessionId: string, status: ChatSessionStatus): Promise<IChatSession | null> => {
        const session = await ChatSession.findOneAndUpdate(
            { sessionId },
            { status },
            { new: true }
        );
        return session;
    },

    // ── Delete a conversation ───────────────────────────────────────────────
    deleteConversation: async (sessionId: string): Promise<boolean> => {
        const res = await ChatSession.findOneAndDelete({ sessionId });
        return !!res;
    },
};

export default ChatService;
