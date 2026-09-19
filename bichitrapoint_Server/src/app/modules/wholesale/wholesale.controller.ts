import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { WholesaleService } from './wholesale.service';
import { generateWholesaleInvoicePdf } from './wholesalePdf.service';

export const WholesaleController = {
    // ── Customers ──────────────────────────────────────────────────────
    createCustomer: catchAsync(async (req: Request, res: Response) => {
        const customer = await WholesaleService.createCustomer(req.body);
        sendResponse(res, {
            statusCode: 201,
            success: true,
            message: 'Wholesale customer created successfully',
            data: customer,
        });
    }),

    getAllCustomers: catchAsync(async (req: Request, res: Response) => {
        const result = await WholesaleService.getAllCustomers(req.query);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Wholesale customers fetched successfully',
            meta: result.meta,
            data: result.data,
        });
    }),

    getCustomerById: catchAsync(async (req: Request, res: Response) => {
        const result = await WholesaleService.getCustomerById(req.params.id);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Wholesale customer details fetched',
            data: result,
        });
    }),

    updateCustomer: catchAsync(async (req: Request, res: Response) => {
        const customer = await WholesaleService.updateCustomer(req.params.id, req.body);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Wholesale customer updated successfully',
            data: customer,
        });
    }),

    deleteCustomer: catchAsync(async (req: Request, res: Response) => {
        const result = await WholesaleService.deleteCustomer(req.params.id);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: result.message,
            data: null,
        });
    }),

    // ── Orders & Invoices ──────────────────────────────────────────────
    createOrder: catchAsync(async (req: Request, res: Response) => {
        const adminId = (req as any).user?.id || (req as any).user?._id;
        const order = await WholesaleService.createOrder(req.body, adminId);
        sendResponse(res, {
            statusCode: 201,
            success: true,
            message: 'Wholesale order & invoice generated successfully',
            data: order,
        });
    }),

    getAllOrders: catchAsync(async (req: Request, res: Response) => {
        const result = await WholesaleService.getAllOrders(req.query);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Wholesale orders fetched successfully',
            meta: result.meta,
            data: result.data,
        });
    }),

    getOrderById: catchAsync(async (req: Request, res: Response) => {
        const order = await WholesaleService.getOrderById(req.params.id);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Wholesale order fetched successfully',
            data: order,
        });
    }),

    updateOrder: catchAsync(async (req: Request, res: Response) => {
        const order = await WholesaleService.updateOrder(req.params.id, req.body);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Wholesale order updated successfully',
            data: order,
        });
    }),

    // ── PDF Invoice Download ───────────────────────────────────────────
    downloadInvoicePdf: catchAsync(async (req: Request, res: Response) => {
        const order = await WholesaleService.getOrderById(req.params.id);
        const pdfBuffer = await generateWholesaleInvoicePdf(order);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="Wholesale-Invoice-${order.invoiceNumber}.pdf"`
        );
        res.setHeader('Content-Length', pdfBuffer.length);
        res.end(pdfBuffer);
    }),

    // ── Stats & Products ───────────────────────────────────────────────
    getStats: catchAsync(async (req: Request, res: Response) => {
        const stats = await WholesaleService.getStats();
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Wholesale stats fetched',
            data: stats,
        });
    }),

    getWholesaleProducts: catchAsync(async (req: Request, res: Response) => {
        const search = typeof req.query.search === 'string' ? req.query.search : undefined;
        const products = await WholesaleService.getWholesaleProducts(search);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Wholesale products list fetched',
            data: products,
        });
    }),
};
