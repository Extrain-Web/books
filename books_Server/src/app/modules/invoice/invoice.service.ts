import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { Order } from '../order/order.model';
import AppError from '../../utils/AppError';
import { sendEmail } from '../../utils/email';

// ── Invoice data shapes (the contract the frontend consumes) ────────
export interface IInvoiceItem {
    name: string;
    sku: string;
    price: number;
    quantity: number;
    total: number;
}

export interface IInvoiceData {
    invoiceNumber: string;
    orderId: string;
    date: string;
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    brand: 'Books River';
    billTo: { name: string; phone: string; email: string };
    shipTo: {
        name: string;
        phone: string;
        address: string;
        area: string;
        city: string;
        postalCode: string;
    };
    items: IInvoiceItem[];
    subtotal: number;
    shippingCost: number;
    discount: number;
    total: number;
    couponCode: string;
}

const BRAND_COLOR = '#F08418'; // Books River Orange
const TEXT_DARK = '#0F172A';
const TEXT_MUTED = '#64748B';
const BORDER_COLOR = '#E2E8F0';

const fmt = (n: number): string => `BDT ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Locate the logo file across possible paths
 */
const findLogoPath = (): string | null => {
    const candidatePaths = [
        path.resolve(process.cwd(), 'assets/Books-River-Logo-Colored.png'),
        path.resolve(process.cwd(), 'dist/assets/Books-River-Logo-Colored.png'),
        path.resolve(process.cwd(), 'src/assets/Books-River-Logo-Colored.png'),
        path.resolve(__dirname, '../../assets/Books-River-Logo-Colored.png'),
        path.resolve(__dirname, '../../../assets/Books-River-Logo-Colored.png'),
        path.resolve(__dirname, '../../../../assets/Books-River-Logo-Colored.png'),
        path.resolve(__dirname, '../../dist/assets/Books-River-Logo-Colored.png'),
        path.resolve(__dirname, '../../../../books_client/public/Books-River-Logo-Colored.png'),
        path.resolve(process.cwd(), '../books_client/public/Books-River-Logo-Colored.png'),
        path.resolve(process.cwd(), 'assets/logo.png'),
        path.resolve(process.cwd(), 'dist/assets/logo.png'),
        path.resolve(process.cwd(), 'src/assets/logo.png'),
        path.resolve(__dirname, '../../assets/logo.png'),
        path.resolve(process.cwd(), 'assets/logo.jpg'),
        path.resolve(process.cwd(), 'dist/assets/logo.jpg'),
        path.resolve(process.cwd(), 'src/assets/logo.jpg'),
        path.resolve(process.cwd(), 'uploads/logo.jpg'),
        path.resolve(process.cwd(), 'uploads/logo.png'),
        path.resolve(__dirname, '../../assets/logo.jpg'),
        path.resolve(__dirname, '../../../assets/logo.jpg'),
        path.resolve(__dirname, '../../../../books_client/public/logo.jpg'),
        path.resolve(process.cwd(), '../books_client/public/logo.jpg'),
    ];

    for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
            return p;
        }
    }
    return null;
};

/**
 * Fetch an order with the populated fields invoices need.
 */
const fetchOrder = async (orderId: string): Promise<any> => {
    const order = await Order.findById(orderId)
        .populate('user', 'firstName lastName email phone')
        .populate('items.product', 'name sku thumbnail');
    if (!order) throw new AppError(404, 'Order not found');
    return order;
};

/**
 * Check if the email is a genuine user email (not auto-generated guest placeholder like phone@guest.booksriver.com)
 */
const isValidCustomerEmail = (email?: string | null): boolean => {
    if (!email) return false;
    const clean = email.trim().toLowerCase();
    if (!clean || clean.includes('@guest.booksriver.com') || clean.includes('@guest.bichitrapoint.com') || clean.endsWith('.guest') || clean.includes('guest@')) {
        return false;
    }
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);
};

/**
 * Build the customer-facing InvoiceData from an order.
 */
const buildCustomerInvoice = (order: any): IInvoiceData => {
    const user = order.user || {};
    const ship = order.shippingAddress || {};
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || ship.fullName || '';

    // Only pick real email if user explicitly entered an email (never show auto-generated guest emails)
    const rawEmail = ship.email || '';
    const email = isValidCustomerEmail(rawEmail) ? rawEmail.trim() : '';

    const items: IInvoiceItem[] = (order.items || []).map((item: any) => {
        const variantInfo = [item.size, item.color].filter(Boolean).join(', ');
        return {
            name: variantInfo ? `${item.name} (${variantInfo})` : item.name,
            sku: item.product?.sku || '',
            price: item.price,
            quantity: item.quantity,
            total: item.total,
        };
    });

    return {
        invoiceNumber: `INV-${order.orderId}`,
        orderId: order.orderId,
        date: new Date(order.createdAt).toISOString(),
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        brand: 'Books River',
        billTo: {
            name,
            phone: ship.phone || user.phone || '',
            email,
        },
        shipTo: {
            name: ship.fullName || name,
            phone: ship.phone || '',
            address: ship.address || '',
            area: ship.area || '',
            city: ship.district || ship.city || '',
            postalCode: ship.postalCode || '',
        },
        items,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost || 0,
        discount: order.discount || 0,
        total: order.total,
        couponCode: order.couponCode || '',
    };
};

/**
 * Render an InvoiceData to a single-page PDF Buffer using pdfkit.
 */
const generateInvoicePdf = (invoice: IInvoiceData): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 40 });
            const chunks: Buffer[] = [];
            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', (err: Error) => reject(err));

            const pageWidth = doc.page.width;
            const left = doc.page.margins.left;
            const right = pageWidth - doc.page.margins.right;
            const contentWidth = right - left;

            // ── Top Header (Clean White Background, Branded Logo & Invoice Meta) ──
            const logoPath = findLogoPath();

            if (logoPath) {
                try {
                    doc.image(logoPath, left, 20, { width: 175 });
                } catch (e) {
                    console.error('[InvoicePdf] Failed to embed logo:', e);
                    doc.fillColor(TEXT_DARK).fontSize(22).font('Helvetica-Bold').text('Books River', left, 28);
                }
            } else {
                doc.fillColor(TEXT_DARK).fontSize(22).font('Helvetica-Bold').text('Books River', left, 28);
            }

            const dateStr = new Date(invoice.date).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
            });
            doc.fillColor(TEXT_DARK).fontSize(11).font('Helvetica-Bold').text(invoice.invoiceNumber, left, 22, { width: contentWidth, align: 'right' });
            doc.font('Helvetica').fontSize(9).fillColor(TEXT_MUTED).text(`Date: ${dateStr}`, left, 38, { width: contentWidth, align: 'right' });
            doc.text(`Order: ${invoice.orderId}`, left, 52, { width: contentWidth, align: 'right' });

            // Header Separator Line
            doc.moveTo(left, 76).lineTo(right, 76).lineWidth(1.5).strokeColor(BRAND_COLOR).stroke();

            // Centered INVOICE title below the blue line
            doc.fillColor(BRAND_COLOR).fontSize(14).font('Helvetica-Bold').text('INVOICE', left, 88, { width: contentWidth, align: 'center' });

            let y = 114;

            // ── Bill To / Ship To columns ──
            const colW = contentWidth / 2 - 12;
            const col2 = left + colW + 24;

            const renderInfoSection = (
                title: string,
                x: number,
                startY: number,
                fields: { label: string; value: string }[]
            ): number => {
                doc.fontSize(10).font('Helvetica-Bold').fillColor(BRAND_COLOR).text(title, x, startY);
                let currentY = startY + 16;
                doc.fontSize(9);

                for (const field of fields) {
                    if (!field.value) continue;
                    const labelStr = `${field.label}: `;
                    doc.font('Helvetica-Bold').fillColor(TEXT_DARK).text(labelStr, x, currentY, {
                        width: colW,
                        continued: true,
                    });
                    doc.font('Helvetica').fillColor(TEXT_DARK).text(field.value, {
                        width: colW,
                    });
                    currentY = doc.y + 4; // neat 4pt spacing with zero unintended gaps!
                }
                return currentY;
            };

            const billFields = [
                { label: 'Name', value: invoice.billTo.name },
                { label: 'Phone Number', value: invoice.billTo.phone },
                ...(invoice.billTo.email ? [{ label: 'Email', value: invoice.billTo.email }] : []),
            ];

            const addrLine = [
                invoice.shipTo.address,
                invoice.shipTo.area,
                invoice.shipTo.city,
                invoice.shipTo.postalCode,
            ].filter(Boolean).join(', ');

            const shipFields = [
                { label: 'Name', value: invoice.shipTo.name },
                { label: 'Address', value: addrLine },
                { label: 'Phone Number', value: invoice.shipTo.phone },
            ];

            const endBillY = renderInfoSection('Bill To', left, y, billFields);
            const endShipY = renderInfoSection('Ship To', col2, y, shipFields);

            y = Math.max(endBillY, endShipY) + 16;

            // ── Items table (No SKU) ──
            const cols = {
                item: left,
                price: left + contentWidth * 0.60,
                qty: left + contentWidth * 0.74,
                total: left + contentWidth * 0.85,
            };

            const itemWidth = cols.price - cols.item - 10;
            const priceWidth = cols.qty - cols.price;
            const qtyWidth = cols.total - cols.qty;
            const totalWidth = right - cols.total - 6;

            doc.rect(left, y, contentWidth, 22).fill(BRAND_COLOR);
            doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
            doc.text('Item', cols.item + 6, y + 7, { width: itemWidth });
            doc.text('Price', cols.price, y + 7, { width: priceWidth, align: 'right' });
            doc.text('Qty', cols.qty, y + 7, { width: qtyWidth, align: 'center' });
            doc.text('Total', cols.total, y + 7, { width: totalWidth, align: 'right' });

            y += 22;
            doc.fillColor(TEXT_DARK).font('Helvetica').fontSize(9);

            for (const item of invoice.items) {
                // Dynamically calculate row height based on text length
                const textHeight = doc.heightOfString(item.name, { width: itemWidth });
                const rowH = Math.max(22, textHeight + 12);

                if (y + rowH > doc.page.height - 120) {
                    doc.addPage();
                    y = 50;
                }
                doc.fillColor(TEXT_DARK);
                doc.text(item.name, cols.item + 6, y + 6, { width: itemWidth });
                doc.text(fmt(item.price), cols.price, y + 6, { width: priceWidth, align: 'right' });
                doc.text(String(item.quantity), cols.qty, y + 6, { width: qtyWidth, align: 'center' });
                doc.text(fmt(item.total), cols.total, y + 6, { width: totalWidth, align: 'right' });
                doc.moveTo(left, y + rowH).lineTo(right, y + rowH).strokeColor(BORDER_COLOR).stroke();
                y += rowH;
            }

            y += 14;

            // ── Totals block (right aligned) ──
            const totalsX = left + contentWidth * 0.55;
            const totalsW = contentWidth * 0.45;
            const labelW = totalsW * 0.55;
            const valW = totalsW * 0.45;

            const totalRow = (label: string, value: string, bold = false, color = TEXT_DARK) => {
                doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 11 : 9).fillColor(color);
                doc.text(label, totalsX, y, { width: labelW });
                doc.text(value, totalsX + labelW, y, { width: valW, align: 'right' });
                y += bold ? 20 : 16;
            };

            totalRow('Subtotal', fmt(invoice.subtotal));
            if (invoice.shippingCost > 0) totalRow('Shipping', fmt(invoice.shippingCost));
            if (invoice.discount > 0) totalRow('Discount', `- ${fmt(invoice.discount)}`);
            doc.moveTo(totalsX, y).lineTo(right, y).strokeColor(BRAND_COLOR).stroke();
            y += 6;
            totalRow('Grand Total', fmt(invoice.total), true, BRAND_COLOR);

            // ── Payment info ──
            y += 6;
            doc.fillColor(TEXT_DARK).font('Helvetica').fontSize(9);
            doc.text(`Payment Method: ${invoice.paymentMethod}`, left, y);
            doc.text(`Payment Status: ${invoice.paymentStatus}`, left, y + 14);
            doc.text(`Order Status: ${invoice.status}`, left, y + 28);
            if (invoice.couponCode) doc.text(`Coupon: ${invoice.couponCode}`, left, y + 42);

            // ── Footer ──
            doc.font('Helvetica-Oblique').fontSize(9).fillColor(TEXT_MUTED)
                .text('Thank you for shopping with Books River', left, doc.page.height - 60, {
                    width: contentWidth, align: 'center',
                });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};

/**
 * Branded HTML invoice summary for the email body.
 */
const buildInvoiceEmailHtml = (invoice: IInvoiceData): string => {
    const rows = invoice.items
        .map(
            (i) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${i.name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${fmt(i.total)}</td>
        </tr>`
        )
        .join('');

    return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #eee;border-radius:8px;overflow:hidden;">
    <div style="background:${BRAND_COLOR};color:#fff;padding:24px;">
      <h1 style="margin:0;font-size:22px;">Books River</h1>
      <p style="margin:4px 0 0;font-size:14px;">Invoice ${invoice.invoiceNumber}</p>
    </div>
    <div style="padding:24px;">
      <p style="margin:0 0 8px;">Order <strong>${invoice.orderId}</strong> &middot; ${new Date(invoice.date).toLocaleDateString('en-GB')}</p>
      <p style="margin:0 0 16px;color:#555;">Hi ${invoice.billTo.name || 'there'}, your invoice is attached as a PDF. Here is a summary:</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#fafafa;">
            <th style="padding:8px;text-align:left;border-bottom:2px solid ${BRAND_COLOR};">Item</th>
            <th style="padding:8px;text-align:center;border-bottom:2px solid ${BRAND_COLOR};">Qty</th>
            <th style="padding:8px;text-align:right;border-bottom:2px solid ${BRAND_COLOR};">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <table style="width:100%;margin-top:16px;font-size:14px;">
        <tr><td style="padding:4px 8px;">Subtotal</td><td style="padding:4px 8px;text-align:right;">${fmt(invoice.subtotal)}</td></tr>
        <tr><td style="padding:4px 8px;">Shipping</td><td style="padding:4px 8px;text-align:right;">${fmt(invoice.shippingCost)}</td></tr>
        ${invoice.discount > 0 ? `<tr><td style="padding:4px 8px;">Discount</td><td style="padding:4px 8px;text-align:right;">- ${fmt(invoice.discount)}</td></tr>` : ''}
        <tr><td style="padding:8px;font-weight:bold;color:${BRAND_COLOR};border-top:2px solid ${BRAND_COLOR};">Grand Total</td><td style="padding:8px;text-align:right;font-weight:bold;color:${BRAND_COLOR};border-top:2px solid ${BRAND_COLOR};">${fmt(invoice.total)}</td></tr>
      </table>
      <p style="margin:16px 0 0;color:#555;">Payment: ${invoice.paymentMethod} (${invoice.paymentStatus})</p>
    </div>
    <div style="background:#fafafa;padding:16px;text-align:center;color:#888;font-size:12px;">
      Thank you for shopping with Books River
    </div>
  </div>`;
};

// ── Auth-scoped public service methods ──────────────────────────────

const getInvoiceData = async (
    orderId: string,
    requester: { userId: string; role: string }
): Promise<IInvoiceData> => {
    const order = await fetchOrder(orderId);
    const isStaff = requester.role === 'admin' || requester.role === 'superadmin';
    if (!isStaff && order.user?._id?.toString() !== requester.userId) {
        throw new AppError(403, 'You do not have permission to view this invoice');
    }
    return buildCustomerInvoice(order);
};

const getInvoicePdf = async (
    orderId: string,
    requester: { userId: string; role: string }
): Promise<Buffer> => {
    const order = await fetchOrder(orderId);
    const isStaff = requester.role === 'admin' || requester.role === 'superadmin';
    if (!isStaff && order.user?._id?.toString() !== requester.userId) {
        throw new AppError(403, 'You do not have permission to view this invoice');
    }
    return generateInvoicePdf(buildCustomerInvoice(order));
};

/**
 * Build + email the customer invoice (PDF attached). Never throws to caller.
 */
const emailInvoiceToCustomer = async (orderId: string): Promise<void> => {
    try {
        const order = await fetchOrder(orderId);
        const invoice = buildCustomerInvoice(order);
        const pdf = await generateInvoicePdf(invoice);
        const candidateEmail = order.shippingAddress?.email || order.user?.email;
        const to = isValidCustomerEmail(candidateEmail) ? candidateEmail.trim() : null;
        if (!to) {
            console.warn(`[Invoice] No valid email for order ${order.orderId}; skipping invoice email.`);
            return;
        }
        await sendEmail({
            to,
            subject: `Your Books River Invoice ${invoice.invoiceNumber}`,
            html: buildInvoiceEmailHtml(invoice),
            attachments: [
                {
                    filename: `Invoice-${order.orderId}.pdf`,
                    content: pdf,
                    contentType: 'application/pdf',
                },
            ],
        });
    } catch (err) {
        console.error('[Invoice] Failed to email invoice:', err);
    }
};

const InvoiceService = {
    fetchOrder,
    buildCustomerInvoice,
    generateInvoicePdf,
    getInvoiceData,
    getInvoicePdf,
    emailInvoiceToCustomer,
};

export default InvoiceService;
