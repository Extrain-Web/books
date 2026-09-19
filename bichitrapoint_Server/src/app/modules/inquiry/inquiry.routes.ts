import express from 'express';
import InquiryController from './inquiry.controller';
import { authMiddleware, authorizeRoles } from '../../middlewares/auth';

const router = express.Router();

// Public routes (no auth needed)
router.post('/', InquiryController.create);
router.get('/product/:productId', InquiryController.getByProduct);

// Admin routes
router.get('/', authMiddleware, authorizeRoles('admin', 'superadmin'), InquiryController.getAll);
router.patch('/:id', authMiddleware, authorizeRoles('admin', 'superadmin'), InquiryController.updateStatus);
router.delete('/:id', authMiddleware, authorizeRoles('admin', 'superadmin'), InquiryController.delete);

export const InquiryRoutes = router;

