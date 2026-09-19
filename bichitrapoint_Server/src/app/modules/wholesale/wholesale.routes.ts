import express from 'express';
import { WholesaleController } from './wholesale.controller';
import { authMiddleware, authorizeRoles } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import {
    createWholesaleCustomerValidation,
    updateWholesaleCustomerValidation,
    createWholesaleOrderValidation,
    updateWholesaleOrderValidation,
} from './wholesale.validation';

const router = express.Router();

// ── All Wholesale routes are strictly protected by Admin/Superadmin ──
router.use(authMiddleware, authorizeRoles('admin', 'superadmin'));

// ── Dashboard Metrics ────────────────────────────────────────────────
router.get('/stats', WholesaleController.getStats);

// ── Product Picker for Orders ────────────────────────────────────────
router.get('/products', WholesaleController.getWholesaleProducts);

// ── Customer Routes ──────────────────────────────────────────────────
router.get('/customers', WholesaleController.getAllCustomers);
router.post('/customers', validateRequest(createWholesaleCustomerValidation), WholesaleController.createCustomer);
router.get('/customers/:id', WholesaleController.getCustomerById);
router.patch('/customers/:id', validateRequest(updateWholesaleCustomerValidation), WholesaleController.updateCustomer);
router.delete('/customers/:id', WholesaleController.deleteCustomer);

// ── Order & Invoice Routes ───────────────────────────────────────────
router.get('/orders', WholesaleController.getAllOrders);
router.post('/orders', validateRequest(createWholesaleOrderValidation), WholesaleController.createOrder);
router.get('/orders/:id', WholesaleController.getOrderById);
router.patch('/orders/:id', validateRequest(updateWholesaleOrderValidation), WholesaleController.updateOrder);
router.get('/orders/:id/pdf', WholesaleController.downloadInvoicePdf);

export const WholesaleRoutes = router;
