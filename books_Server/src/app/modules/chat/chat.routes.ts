import express from 'express';
import ChatController from './chat.controller';
import { authMiddleware, authorizeRoles, optionalAuth } from '../../middlewares/auth';

const router = express.Router();

// ── Customer / Public Routes ─────────────────────────────────────────────
router.post('/send', optionalAuth, ChatController.sendMessage);
router.get('/session/:sessionId', optionalAuth, ChatController.getSession);

// ── Admin Routes ─────────────────────────────────────────────────────────
router.get('/conversations', authMiddleware, authorizeRoles('admin', 'superadmin'), ChatController.getAllConversations);
router.get('/conversations/:sessionId', authMiddleware, authorizeRoles('admin', 'superadmin'), ChatController.getSession);
router.post('/conversations/:sessionId/reply', authMiddleware, authorizeRoles('admin', 'superadmin'), ChatController.replyMessage);
router.patch('/conversations/:sessionId/status', authMiddleware, authorizeRoles('admin', 'superadmin'), ChatController.updateStatus);
router.delete('/conversations/:sessionId', authMiddleware, authorizeRoles('admin', 'superadmin'), ChatController.deleteConversation);

export const ChatRoutes = router;
