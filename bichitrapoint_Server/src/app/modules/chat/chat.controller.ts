import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import ChatService from './chat.service';

const ChatController = {
    // ── Public / Customer: Send message in chat ──────────────────────────────
    sendMessage: catchAsync(async (req: Request, res: Response) => {
        const { sessionId, text, customerName, customerPhone, customerEmail, botReply } = req.body;
        const userId = (req as any).user?._id;

        if (!sessionId || !text) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: 'Session ID and message text are required',
            });
        }

        const session = await ChatService.sendMessageFromUser({
            sessionId,
            text,
            customerName: customerName || (req as any).user?.name,
            customerPhone: customerPhone || (req as any).user?.phone,
            customerEmail: customerEmail || (req as any).user?.email,
            userId,
            botReply,
        });

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Message sent successfully',
            data: session,
        });
    }),

    // ── Public / Customer: Get session messages ──────────────────────────────
    getSession: catchAsync(async (req: Request, res: Response) => {
        const { sessionId } = req.params;
        const { markRead } = req.query;
        const role = (req as any).user?.role === 'admin' || (req as any).user?.role === 'superadmin' ? 'admin' : 'user';

        const session = await ChatService.getConversationBySession(
            sessionId,
            role,
            markRead === 'true' || markRead === '1'
        );

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Chat session fetched',
            data: session,
        });
    }),

    // ── Admin: Get all conversations ─────────────────────────────────────────
    getAllConversations: catchAsync(async (req: Request, res: Response) => {
        const result = await ChatService.getAllConversations(req.query as Record<string, any>);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Conversations fetched successfully',
            data: {
                conversations: result.conversations,
                stats: result.stats,
            },
            meta: {
                page: result.meta.page,
                limit: result.meta.limit,
                total: result.meta.total,
                totalPages: result.meta.pages,
            },
        });
    }),

    // ── Admin: Reply to customer ─────────────────────────────────────────────
    replyMessage: catchAsync(async (req: Request, res: Response) => {
        const { sessionId } = req.params;
        const { text } = req.body;
        const adminUser = (req as any).user || { name: 'Support Agent' };

        if (!text || !text.trim()) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: 'Reply text cannot be empty',
            });
        }

        const session = await ChatService.replyFromAdmin(sessionId, adminUser, text);

        if (!session) {
            return sendResponse(res, {
                statusCode: 404,
                success: false,
                message: 'Conversation session not found',
            });
        }

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Reply sent successfully',
            data: session,
        });
    }),

    // ── Admin: Update conversation status ────────────────────────────────────
    updateStatus: catchAsync(async (req: Request, res: Response) => {
        const { sessionId } = req.params;
        const { status } = req.body;

        const session = await ChatService.updateStatus(sessionId, status);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Status updated successfully',
            data: session,
        });
    }),

    // ── Admin: Delete conversation ───────────────────────────────────────────
    deleteConversation: catchAsync(async (req: Request, res: Response) => {
        const { sessionId } = req.params;
        await ChatService.deleteConversation(sessionId);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Conversation deleted successfully',
        });
    }),
};

export default ChatController;
