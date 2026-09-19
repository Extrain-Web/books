import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { IWholesaleOrder } from './wholesaleOrder.model';
import { SiteContent } from '../siteContent/siteContent.model';

const BRAND_COLOR = '#0072BC'; // Bichitra Point Blue
const BRAND_DARK = '#00558F';
const BORDER_COLOR = '#CBD5E1';
const TEXT_DARK = '#0F172A';
const TEXT_MUTED = '#475569';

const fmt = (n: number): string => `BDT ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Locate the logo file across possible production / development paths
 */
const findLogoPath = (): string | null => {
    const candidatePaths = [
        path.resolve(process.cwd(), 'assets/Bichitra-Point-Logo-Colored.png'),
        path.resolve(process.cwd(), 'dist/assets/Bichitra-Point-Logo-Colored.png'),
        path.resolve(process.cwd(), 'src/assets/Bichitra-Point-Logo-Colored.png'),
        path.resolve(__dirname, '../../assets/Bichitra-Point-Logo-Colored.png'),
        path.resolve(__dirname, '../../../assets/Bichitra-Point-Logo-Colored.png'),
        path.resolve(__dirname, '../../../../assets/Bichitra-Point-Logo-Colored.png'),
        path.resolve(__dirname, '../../dist/assets/Bichitra-Point-Logo-Colored.png'),
        path.resolve(__dirname, '../../../../bichitrapoint_client/public/Bichitra-Point-Logo-Colored.png'),
        path.resolve(process.cwd(), '../bichitrapoint_client/public/Bichitra-Point-Logo-Colored.png'),
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
        path.resolve(__dirname, '../../../../assets/logo.jpg'),
        path.resolve(__dirname, '../../../../bichitrapoint_client/public/logo.jpg'),
        path.resolve(process.cwd(), '../bichitrapoint_client/public/logo.jpg'),
    ];

    for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
            return p;
        }
    }
    return null;
};

export const generateWholesaleInvoicePdf = async (order: IWholesaleOrder): Promise<Buffer> => {
    // Fetch site contact info for branding (with safe fallback)
    let phone = '01739498553';
    let email = 'support@bichitrapoint.com';
    let address = '6 Kalabagan, Bus Stand, Dhaka-1205';

    try {
        const siteContent = await SiteContent.findOne({ _key: 'main' }).lean().maxTimeMS(2000);
        if (siteContent?.contact) {
            phone = siteContent.contact.phone || phone;
            email = siteContent.contact.email || email;
            address = siteContent.contact.address || address;
        }
    } catch {
        // Fallback to defaults
    }

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
                    doc.image(logoPath, left, 14, { width: 160 });
                } catch (e) {
                    console.error('[WholesalePdf] Failed to embed logo:', e);
                    doc.fillColor(TEXT_DARK).fontSize(20).font('Helvetica-Bold').text('Bichitra Point', left, 18);
                }
            } else {
                doc.fillColor(TEXT_DARK).fontSize(20).font('Helvetica-Bold').text('Bichitra Point', left, 18);
            }

            // Contact & Address below logo
            doc.fillColor(TEXT_MUTED).fontSize(8).font('Helvetica').text(address, left, 54, { width: contentWidth * 0.48 });
            doc.text(`Phone: ${phone} | Email: ${email}`, left, 66, { width: contentWidth * 0.48 });

            // Right header box: Invoice details
            doc.fillColor(BRAND_COLOR).fontSize(15).font('Helvetica-Bold').text('WHOLESALE INVOICE', left, 18, { width: contentWidth, align: 'right' });
            doc.fillColor(TEXT_DARK).fontSize(10).font('Helvetica-Bold').text(order.invoiceNumber, left, 36, { width: contentWidth, align: 'right' });

            const dateStr = new Date(order.orderDate).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
            });
            doc.fillColor(TEXT_MUTED).fontSize(8.5).font('Helvetica').text(`Date: ${dateStr}`, left, 50, { width: contentWidth, align: 'right' });

            const statusUpper = (order.paymentStatus || 'unpaid').toUpperCase();
            const statusColor = order.paymentStatus === 'paid' ? '#059669' : (order.paymentStatus === 'partial' ? '#D97706' : '#DC2626');
            doc.fillColor(statusColor).font('Helvetica-Bold').fontSize(8.5).text(`Status: ${statusUpper}`, left, 64, { width: contentWidth, align: 'right' });

            // Header Separator Line
            doc.moveTo(left, 86).lineTo(right, 86).lineWidth(1.5).strokeColor(BRAND_COLOR).stroke();

            let y = 100;

            // ── Bill To Customer Block ────────────────────────────────
            doc.rect(left, y, contentWidth, 75).fillAndStroke('#F8FAFC', BORDER_COLOR);

            const snap = (order.customerSnapshot || {}) as any;
            doc.fillColor(BRAND_COLOR).fontSize(10).font('Helvetica-Bold').text('CUSTOMER INFORMATION:', left + 14, y + 10);
            doc.fillColor(TEXT_DARK).fontSize(11).font('Helvetica-Bold').text(snap.businessName || 'N/A', left + 14, y + 26);

            doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica');
            const contactLine = snap.contactName ? `Contact: ${snap.contactName}` : '';
            if (contactLine) doc.text(contactLine, left + 14, y + 40);
            doc.text(`Phone: ${snap.phone || 'N/A'}${snap.email ? ` | Email: ${snap.email}` : ''}`, left + 14, y + 54);
            doc.text(`Address: ${snap.address || 'N/A'}${snap.city ? `, ${snap.city}` : ''}`, left + 280, y + 26, { width: contentWidth - 290 });

            y += 90;

            // ── Table Header ──────────────────────────────────────────
            const cols = {
                sl: left,
                name: left + 26,
                qty: left + contentWidth * 0.60,
                price: left + contentWidth * 0.71,
                total: left + contentWidth * 0.85,
            };

            const nameWidth = cols.qty - cols.name - 10;
            const qtyWidth = cols.price - cols.qty;
            const priceWidth = cols.total - cols.price;
            const totalWidth = right - cols.total - 6;

            doc.rect(left, y, contentWidth, 24).fill(BRAND_COLOR);
            doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
            doc.text('SL', cols.sl + 6, y + 7);
            doc.text('Product Name', cols.name + 6, y + 7);
            doc.text('Quantity', cols.qty, y + 7, { width: qtyWidth, align: 'center' });
            doc.text('Unit Price', cols.price, y + 7, { width: priceWidth, align: 'right' });
            doc.text('Total', cols.total, y + 7, { width: totalWidth, align: 'right' });

            y += 24;
            doc.fillColor(TEXT_DARK).font('Helvetica').fontSize(9);

            let sl = 1;
            for (const item of order.items) {
                const itemTitle = item.variantLabel ? `${item.name} (${item.variantLabel})` : item.name;
                
                // Dynamically calculate row height based on text wrapping
                const textHeight = doc.heightOfString(itemTitle, { width: nameWidth });
                const rowH = Math.max(22, textHeight + 12);

                if (y + rowH > doc.page.height - 180) {
                    doc.addPage();
                    y = 40;
                }

                // Row background (alternating)
                if (sl % 2 === 0) {
                    doc.rect(left, y, contentWidth, rowH).fill('#F8FAFC');
                }

                doc.fillColor(TEXT_DARK);
                doc.text(String(sl), cols.sl + 6, y + 6);
                doc.text(itemTitle, cols.name + 6, y + 6, { width: nameWidth });
                doc.text(String(item.quantity), cols.qty, y + 6, { width: qtyWidth, align: 'center' });
                doc.text(fmt(item.unitPrice), cols.price, y + 6, { width: priceWidth, align: 'right' });
                doc.text(fmt(item.total), cols.total, y + 6, { width: totalWidth, align: 'right' });

                doc.moveTo(left, y + rowH).lineTo(right, y + rowH).strokeColor(BORDER_COLOR).stroke();
                y += rowH;
                sl++;
            }

            y += 12;

            // ── Summary & Totals Section (Payment terms removed) ────────
            if (y > doc.page.height - 180) {
                doc.addPage();
                y = 40;
            }

            const totalsW = contentWidth * 0.45;
            const totalsX = left + contentWidth - totalsW;

            // Right side: Totals calculation
            const labelW = totalsW * 0.52;
            const valW = totalsW * 0.48;

            const addSummaryLine = (label: string, val: string, bold = false, color = TEXT_DARK) => {
                doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 10 : 9).fillColor(color);
                doc.text(label, totalsX, y, { width: labelW });
                doc.text(val, totalsX + labelW, y, { width: valW, align: 'right' });
                y += bold ? 18 : 15;
            };

            const startTotalsY = y;
            addSummaryLine('Subtotal:', fmt(order.subtotal));
            if (order.discount > 0) addSummaryLine('Discount:', `- ${fmt(order.discount)}`, false, '#DC2626');
            if (order.deliveryCharge > 0) addSummaryLine('Delivery Charge:', fmt(order.deliveryCharge));

            doc.moveTo(totalsX, y).lineTo(right, y).strokeColor(BORDER_COLOR).stroke();
            y += 4;
            addSummaryLine('Grand Total:', fmt(order.grandTotal), true, BRAND_COLOR);
            addSummaryLine('Paid Amount:', fmt(order.paidAmount), false, '#059669');

            const prevDue = Number(order.previousDue) || 0;
            const currentInvoiceDue = Number(order.dueAmount) || 0;
            const totalOutstandingDue = prevDue + currentInvoiceDue;

            addSummaryLine('Previous Due Amount:', fmt(prevDue), false, prevDue > 0 ? '#DC2626' : TEXT_MUTED);
            addSummaryLine('Total Due Amount:', fmt(totalOutstandingDue), true, totalOutstandingDue > 0 ? '#DC2626' : '#059669');

            y = Math.max(y, startTotalsY + 115);

            // ── Footer Signatures ─────────────────────────────────────
            const footerY = doc.page.height - 75;
            doc.moveTo(left, footerY).lineTo(left + 150, footerY).strokeColor('#94A3B8').stroke();
            doc.moveTo(right - 150, footerY).lineTo(right, footerY).strokeColor('#94A3B8').stroke();

            doc.fillColor('#64748B').fontSize(8).font('Helvetica');
            doc.text('Customer Signature & Seal', left, footerY + 5, { width: 150, align: 'center' });
            doc.text('Authorized Signature', right - 150, footerY + 5, { width: 150, align: 'center' });

            doc.text('Thank you for doing business with Bichitra Point!', left, footerY + 22, { width: contentWidth, align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};
