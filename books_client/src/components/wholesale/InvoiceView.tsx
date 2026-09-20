/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import {
    LuPrinter,
    LuDownload,
    LuArrowLeft,
    LuCircleCheck,
    LuClock,
    LuCircleAlert,
    LuPhone,
    LuMail,
    LuMapPin,
    LuGlobe,
    LuPencil,
    LuPlus,
    LuMinus,
    LuTrash2,
    LuPackagePlus,
    LuX,
    LuSave,
} from 'react-icons/lu';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { IWholesaleOrder, IWholesaleOrderItem, useUpdateWholesaleOrderMutation } from '@/redux/api/wholesaleApi';
import { toast } from 'react-hot-toast';
import { ProductSelectModal } from './ProductSelectModal';

interface InvoiceViewProps {
    order: IWholesaleOrder;
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({ order }) => {
    const reduxToken = useSelector((s: RootState) => s.auth.token);
    const [updateOrder, { isLoading: isUpdating }] = useUpdateWholesaleOrderMutation();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isProductSelectOpen, setIsProductSelectOpen] = useState(false);

    // Edit form state
    const [editItems, setEditItems] = useState<IWholesaleOrderItem[]>([]);
    const [editDiscount, setEditDiscount] = useState<number>(0);
    const [editDeliveryCharge, setEditDeliveryCharge] = useState<number>(0);
    const [editPaidAmount, setEditPaidAmount] = useState<number>(0);
    const [editOrderStatus, setEditOrderStatus] = useState<string>('confirmed');
    const [editPaymentMethod, setEditPaymentMethod] = useState<string>('cash');
    const [editNotes, setEditNotes] = useState<string>('');

    const openEditModal = () => {
        setEditItems(
            (order.items || []).map((item) => ({
                product: typeof item.product === 'object' ? (item.product as any)._id : item.product,
                name: item.name,
                sku: item.sku || '',
                thumbnail: item.thumbnail || '',
                variantLabel: item.variantLabel || '',
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                retailPrice: item.retailPrice || 0,
                total: item.quantity * item.unitPrice,
            }))
        );
        setEditDiscount(order.discount || 0);
        setEditDeliveryCharge(order.deliveryCharge || 0);
        setEditPaidAmount(order.paidAmount || 0);
        setEditOrderStatus(order.orderStatus || 'confirmed');
        setEditPaymentMethod(order.paymentMethod || 'cash');
        setEditNotes(order.notes || '');
        setIsEditModalOpen(true);
    };

    const handleQuantityChange = (index: number, newQty: number) => {
        const qty = Math.max(1, Math.floor(newQty) || 1);
        const updated = [...editItems];
        updated[index] = {
            ...updated[index],
            quantity: qty,
            total: qty * updated[index].unitPrice,
        };
        setEditItems(updated);
    };

    const handleUnitPriceChange = (index: number, newPrice: number) => {
        const price = Math.max(0, Number(newPrice) || 0);
        const updated = [...editItems];
        updated[index] = {
            ...updated[index],
            unitPrice: price,
            total: updated[index].quantity * price,
        };
        setEditItems(updated);
    };

    const handleRemoveItem = (index: number) => {
        if (editItems.length <= 1) {
            toast.error('Invoice must contain at least 1 product');
            return;
        }
        setEditItems(editItems.filter((_, idx) => idx !== index));
    };

    const handleAddProductFromModal = (item: {
        product: string;
        name: string;
        sku: string;
        thumbnail: string;
        variantLabel?: string;
        quantity: number;
        unitPrice: number;
        retailPrice: number;
    }) => {
        const existingIndex = editItems.findIndex(
            (i) =>
                (typeof i.product === 'string' ? i.product : (i.product as any)?._id) === item.product &&
                (i.variantLabel || '') === (item.variantLabel || '')
        );

        if (existingIndex > -1) {
            const updated = [...editItems];
            const newQty = updated[existingIndex].quantity + item.quantity;
            updated[existingIndex] = {
                ...updated[existingIndex],
                quantity: newQty,
                total: newQty * updated[existingIndex].unitPrice,
            };
            setEditItems(updated);
            toast.success(`Updated quantity for ${item.name}`);
        } else {
            setEditItems([
                ...editItems,
                {
                    product: item.product,
                    name: item.name,
                    sku: item.sku,
                    thumbnail: item.thumbnail,
                    variantLabel: item.variantLabel,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    retailPrice: item.retailPrice,
                    total: item.quantity * item.unitPrice,
                },
            ]);
            toast.success(`Added ${item.name} to invoice`);
        }
    };

    // Live calculations for edit modal
    const editSubtotal = editItems.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);
    const editGrandTotal = Math.max(0, editSubtotal - (editDiscount || 0) + (editDeliveryCharge || 0));
    const editDueAmount = Math.max(0, editGrandTotal - (editPaidAmount || 0));

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPdf = () => {
        const token = reduxToken || (typeof window !== 'undefined' ? localStorage.getItem('token') : '');
        const url = `${API_URL}/wholesale/orders/${order._id}/pdf`;

        // Trigger direct download via fetch to include authorization header
        fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => {
                if (!res.ok) throw new Error('PDF download failed');
                return res.blob();
            })
            .then((blob) => {
                const blobUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = `Wholesale-Invoice-${order.invoiceNumber}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(blobUrl);
            })
            .catch(() => toast.error('Could not download PDF invoice'));
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editItems.length === 0) {
            toast.error('At least one product is required');
            return;
        }

        try {
            await updateOrder({
                id: order._id,
                body: {
                    items: editItems.map((item) => ({
                        product: typeof item.product === 'object' ? (item.product as any)._id : item.product,
                        name: item.name,
                        sku: item.sku || '',
                        thumbnail: item.thumbnail || '',
                        variantLabel: item.variantLabel || '',
                        quantity: Number(item.quantity) || 1,
                        unitPrice: Number(item.unitPrice) || 0,
                        retailPrice: Number(item.retailPrice) || 0,
                        total: Number(item.quantity) * Number(item.unitPrice),
                    })),
                    discount: Number(editDiscount) || 0,
                    deliveryCharge: Number(editDeliveryCharge) || 0,
                    paidAmount: Number(editPaidAmount) || 0,
                    orderStatus: editOrderStatus,
                    paymentMethod: editPaymentMethod,
                    notes: editNotes,
                },
            }).unwrap();
            toast.success('Invoice and products updated successfully');
            setIsEditModalOpen(false);
        } catch (err: any) {
            toast.error(err?.data?.message || 'Failed to update order');
        }
    };

    const snap = order.customerSnapshot || {};
    const formattedDate = new Date(order.orderDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

    const getStatusBadge = () => {
        if (order.paymentStatus === 'paid') {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-300">
                    <LuCircleCheck size={14} /> PAID
                </span>
            );
        }
        if (order.paymentStatus === 'partial') {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-300">
                    <LuClock size={14} /> PARTIAL (DUE: ৳{order.dueAmount.toLocaleString()})
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full border border-red-300">
                <LuCircleAlert size={14} /> UNPAID / DUE
            </span>
        );
    };

    const previousDue = Number(order.previousDue ?? (typeof order.customer === 'object' && order.customer !== null ? (order.customer as any).currentDue : 0)) || 0;
    const currentInvoiceDue = Number(order.dueAmount) || 0;
    const totalOutstandingDue = previousDue + currentInvoiceDue;

    return (
        <div className="space-y-6">
            {/* Top Action Bar (Hidden on Print) */}
            <div className="flex flex-wrap items-center justify-between gap-4 print:hidden bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <Link
                    href="/dashboard/admin/wholesale"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <LuArrowLeft size={16} /> Back to Wholesale Orders
                </Link>

                <div className="flex items-center gap-3">
                    <button
                        onClick={openEditModal}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-[#0072BC] text-xs font-bold rounded-lg border border-blue-200 transition-all shadow-sm"
                    >
                        <LuPencil size={14} /> Edit Invoice & Products
                    </button>
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#0072BC] hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-blue-600/20"
                    >
                        <LuPrinter size={14} /> Print Invoice (A4)
                    </button>
                    <button
                        onClick={handleDownloadPdf}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-slate-900/20"
                    >
                        <LuDownload size={14} /> Download PDF
                    </button>
                </div>
            </div>

            {/* A4 Printable Invoice Sheet */}
            <div
                id="printable-invoice"
                className="bg-white mx-auto p-8 sm:p-12 rounded-xl border border-gray-200 shadow-md max-w-4xl print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none text-slate-800 font-sans"
            >
                {/* 1. Header & Brand */}
                <div className="border-b-2 border-[#0072BC] pb-6 mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <div>
                                <Image
                                    src="/Books-River-Logo-Colored.png"
                                    alt="Books River"
                                    width={200}
                                    height={50}
                                    className="h-10 w-auto object-contain"
                                    priority
                                />
                            </div>
                            <div className="mt-3 text-xs text-gray-600 space-y-0.5">
                                <p className="flex items-center gap-1.5">
                                    <LuMapPin size={13} className="text-[#0072BC] shrink-0" />
                                    6 Kalabagan, Bus Stand, Dhaka-1205
                                </p>
                                <p className="flex items-center gap-1.5">
                                    <LuPhone size={13} className="text-[#0072BC] shrink-0" /> +880 1739-498553
                                    <span className="mx-1">•</span>
                                    <LuMail size={13} className="text-[#0072BC] shrink-0" /> support@booksriver.com
                                </p>
                                <p className="flex items-center gap-1.5">
                                    <LuGlobe size={13} className="text-[#0072BC] shrink-0" /> www.booksriver.com
                                </p>
                            </div>
                        </div>

                        {/* Invoice Metadata */}
                        <div className="text-right sm:text-right w-full sm:w-auto bg-blue-50/70 p-4 rounded-xl border border-blue-100 print:bg-transparent print:border-none print:p-0">
                            <h2 className="text-xl font-black text-[#0072BC] mb-1">WHOLESALE INVOICE</h2>
                            <p className="text-sm font-bold text-gray-800 font-mono">{order.invoiceNumber}</p>
                            <p className="text-xs text-gray-600 mt-1">Invoice Date: <span className="font-semibold">{formattedDate}</span></p>
                            <div className="mt-2.5">{getStatusBadge()}</div>
                        </div>
                    </div>
                </div>

                {/* 2. Customer & Invoice Meta Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 rounded-xl bg-gray-50 border border-gray-200 mb-6 print:bg-transparent print:border-gray-300 print:p-2">
                    <div className="space-y-1">
                        <span className="text-[11px] font-black uppercase tracking-wider text-[#0072BC] block mb-1">
                            Customer Information
                        </span>
                        <p className="text-sm font-bold text-gray-900">{snap.businessName || 'N/A'}</p>
                        <p className="text-xs text-gray-700">
                            <span className="font-semibold text-gray-500">Phone:</span> {snap.phone || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-700">
                            <span className="font-semibold text-gray-500">Address:</span> {snap.address || 'N/A'}{snap.city ? `, ${snap.city}` : ''}
                        </p>
                        {snap.contactName && (
                            <p className="text-xs text-gray-500">
                                <span className="font-semibold">Contact Person:</span> {snap.contactName}
                            </p>
                        )}
                    </div>
                    <div className="space-y-1 sm:text-right">
                        <span className="text-[11px] font-black uppercase tracking-wider text-[#0072BC] block mb-1">
                            Invoice Details
                        </span>
                        <p className="text-xs text-gray-700">
                            <span className="font-semibold text-gray-500">Invoice Number:</span>{' '}
                            <span className="font-mono font-bold text-gray-900">{order.invoiceNumber}</span>
                        </p>
                        <p className="text-xs text-gray-700">
                            <span className="font-semibold text-gray-500">Invoice Date:</span> {formattedDate}
                        </p>
                        <p className="text-xs text-gray-700">
                            <span className="font-semibold text-gray-500">Payment Method:</span>{' '}
                            <span className="font-bold uppercase text-gray-800">{order.paymentMethod}</span>
                        </p>
                        <div className="pt-1">{getStatusBadge()}</div>
                    </div>
                </div>

                {/* 3. Products Table */}
                <div className="overflow-x-auto mb-6">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#0072BC] text-white text-xs font-bold uppercase tracking-wider">
                                <th className="py-2.5 px-3 rounded-l-md w-12 text-center">SL</th>
                                <th className="py-2.5 px-3">Product Name</th>
                                <th className="py-2.5 px-3 text-center w-24">Quantity</th>
                                <th className="py-2.5 px-3 text-right w-28">Unit Price</th>
                                <th className="py-2.5 px-3 text-right rounded-r-md w-32">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs text-gray-800">
                            {order.items.map((item, idx) => (
                                <tr key={idx} className={idx % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'}>
                                    <td className="py-3 px-3 text-center font-bold text-gray-500">{idx + 1}</td>
                                    <td className="py-3 px-3">
                                        <p className="font-bold text-gray-900">{item.name}</p>
                                        {item.variantLabel && (
                                            <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-medium inline-block mt-0.5">
                                                Variant: {item.variantLabel}
                                            </span>
                                        )}
                                        {item.retailPrice > 0 && item.retailPrice > item.unitPrice && (
                                            <span className="text-[10px] text-gray-400 block mt-0.5">Retail MRP: ৳{item.retailPrice}</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-3 text-center font-bold text-gray-900">{item.quantity}</td>
                                    <td className="py-3 px-3 text-right font-medium">৳ {item.unitPrice.toLocaleString()}</td>
                                    <td className="py-3 px-3 text-right font-bold text-gray-900">
                                        ৳ {item.total.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 4. Summary & Calculations */}
                <div className="flex justify-end pt-4 border-t border-gray-200 mb-8">
                    {/* Right: Totals Box */}
                    <div className="w-full sm:w-80 space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-gray-100">
                            <span className="text-gray-600 font-medium">Subtotal:</span>
                            <span className="font-semibold text-gray-800">৳ {order.subtotal.toLocaleString()}</span>
                        </div>
                        {order.discount > 0 && (
                            <div className="flex justify-between py-1 border-b border-gray-100 text-red-600">
                                <span>Discount:</span>
                                <span className="font-semibold">- ৳ {order.discount.toLocaleString()}</span>
                            </div>
                        )}
                        {order.deliveryCharge > 0 && (
                            <div className="flex justify-between py-1 border-b border-gray-100 text-gray-600">
                                <span>Delivery Charge:</span>
                                <span className="font-semibold text-gray-800">৳ {order.deliveryCharge.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between py-2 border-b-2 border-[#0072BC] text-sm font-bold text-[#0072BC]">
                            <span>Grand Total:</span>
                            <span>৳ {order.grandTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-1 text-emerald-700 font-semibold">
                            <span>Paid Amount:</span>
                            <span>৳ {order.paidAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-1 text-red-600 font-semibold">
                            <span>Previous Due Amount:</span>
                            <span>৳ {previousDue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-2 text-sm font-black bg-gray-50 px-3 rounded-lg border border-gray-200 shadow-sm">
                            <span className={totalOutstandingDue > 0 ? 'text-red-700' : 'text-emerald-700'}>
                                Total Due Amount:
                            </span>
                            <span className={totalOutstandingDue > 0 ? 'text-red-700 font-black' : 'text-emerald-700 font-black'}>
                                ৳ {totalOutstandingDue.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 5. Footer & Signatures */}
                <div className="pt-12 mt-8 border-t border-gray-200 grid grid-cols-2 gap-8 text-center text-xs text-gray-500">
                    <div>
                        <div className="w-48 mx-auto border-t border-gray-400 pt-1 font-semibold text-gray-700">
                            Customer Seal & Signature
                        </div>
                    </div>
                    <div>
                        <div className="w-48 mx-auto border-t border-gray-400 pt-1 font-semibold text-gray-700">
                            Authorized Signature
                        </div>
                    </div>
                </div>

                <div className="text-center text-[12px] text-gray-600 font-medium mt-8 pt-4 border-t border-gray-100">
                    <p>Thank you for doing business with Books River!</p>
                </div>
            </div>

            {/* Edit Wholesale Invoice & Products Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-scaleUp">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#0072BC] to-[#00558F] text-white flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-base">Edit Invoice & Products</h3>
                                <p className="text-xs text-blue-100">Invoice: {order.invoiceNumber} • {snap.businessName || 'Customer'}</p>
                            </div>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <LuX size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
                            {/* Products Header & Add Button */}
                            <div className="flex items-center justify-between border-b pb-3">
                                <div>
                                    <h4 className="font-bold text-sm text-gray-900">Invoice Items ({editItems.length})</h4>
                                    <p className="text-gray-500 text-[11px]">Add more products or adjust quantity and price</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsProductSelectOpen(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0072BC] hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-sm transition-all"
                                >
                                    <LuPackagePlus size={15} /> + Add Product
                                </button>
                            </div>

                            {/* Products Table */}
                            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="max-h-60 overflow-y-auto divide-y divide-gray-100">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="sticky top-0 bg-gray-50 text-[11px] font-bold text-gray-600 uppercase border-b border-gray-200">
                                            <tr>
                                                <th className="py-2 px-3">Product</th>
                                                <th className="py-2 px-3 text-right w-28">Unit Price (৳)</th>
                                                <th className="py-2 px-3 text-center w-32">Quantity</th>
                                                <th className="py-2 px-3 text-right w-28">Total (৳)</th>
                                                <th className="py-2 px-2 text-center w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-xs text-gray-800">
                                            {editItems.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-blue-50/30">
                                                    <td className="py-2.5 px-3">
                                                        <p className="font-bold text-gray-900">{item.name}</p>
                                                        {item.variantLabel && (
                                                            <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-medium inline-block mt-0.5">
                                                                {item.variantLabel}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={item.unitPrice}
                                                            onChange={(e) => handleUnitPriceChange(idx, Number(e.target.value))}
                                                            className="w-20 px-2 py-1 border border-gray-300 rounded text-right font-medium outline-none focus:border-blue-500"
                                                        />
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center">
                                                        <div className="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleQuantityChange(idx, item.quantity - 1)}
                                                                className="px-2 py-1 text-gray-600 hover:bg-gray-100 active:bg-gray-200"
                                                            >
                                                                <LuMinus size={12} />
                                                            </button>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={item.quantity}
                                                                onChange={(e) => handleQuantityChange(idx, Number(e.target.value))}
                                                                className="w-12 py-1 text-center font-bold outline-none border-x border-gray-200"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleQuantityChange(idx, item.quantity + 1)}
                                                                className="px-2 py-1 text-gray-600 hover:bg-gray-100 active:bg-gray-200"
                                                            >
                                                                <LuPlus size={12} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                                                        ৳ {(item.quantity * item.unitPrice).toLocaleString()}
                                                    </td>
                                                    <td className="py-2.5 px-2 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveItem(idx)}
                                                            className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                                                            title="Remove Item"
                                                        >
                                                            <LuTrash2 size={15} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Summary & Price adjustments */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <div>
                                        <label className="block font-bold text-gray-700 mb-1">Discount (৳)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={editDiscount}
                                            onChange={(e) => setEditDiscount(Math.max(0, Number(e.target.value) || 0))}
                                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-gray-700 mb-1">Delivery Charge (৳)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={editDeliveryCharge}
                                            onChange={(e) => setEditDeliveryCharge(Math.max(0, Number(e.target.value) || 0))}
                                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-gray-700 mb-1">Paid Amount (৳)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={editPaidAmount}
                                            onChange={(e) => setEditPaidAmount(Math.max(0, Number(e.target.value) || 0))}
                                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 bg-white font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 text-xs flex flex-col justify-center bg-white p-3.5 rounded-lg border border-gray-200">
                                    <div className="flex justify-between py-1 border-b border-gray-100">
                                        <span className="text-gray-600 font-medium">Subtotal:</span>
                                        <span className="font-bold text-gray-800">৳ {editSubtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-gray-100 text-red-600">
                                        <span>Discount:</span>
                                        <span className="font-semibold">- ৳ {editDiscount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-gray-100 text-gray-600">
                                        <span>Delivery Charge:</span>
                                        <span className="font-semibold">+ ৳ {editDeliveryCharge.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 border-b-2 border-[#0072BC] text-sm font-bold text-[#0072BC]">
                                        <span>Grand Total:</span>
                                        <span>৳ {editGrandTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between py-1 text-emerald-700 font-semibold">
                                        <span>Paid Amount:</span>
                                        <span>৳ {editPaidAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between py-1 text-red-600 font-semibold">
                                        <span>Previous Due Amount:</span>
                                        <span>৳ {previousDue.toLocaleString()}</span>
                                    </div>
                                    <div className={`flex justify-between py-1.5 px-2 rounded font-bold ${previousDue + editDueAmount > 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                        <span>Total Due Amount:</span>
                                        <span>৳ {(previousDue + editDueAmount).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Order & Payment Settings */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Payment Method</label>
                                    <select
                                        value={editPaymentMethod}
                                        onChange={(e) => setEditPaymentMethod(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-600 cursor-pointer"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="bank_transfer">Bank Transfer</option>
                                        <option value="bkash">bKash</option>
                                        <option value="nagad">Nagad</option>
                                        <option value="cheque">Cheque</option>
                                        <option value="credit">Credit</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Order Status</label>
                                    <select
                                        value={editOrderStatus}
                                        onChange={(e) => setEditOrderStatus(e.target.value as any)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-600 cursor-pointer"
                                    >
                                        <option value="confirmed">Confirmed</option>
                                        <option value="processing">Processing</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Notes / Remarks</label>
                                <textarea
                                    rows={2}
                                    value={editNotes}
                                    onChange={(e) => setEditNotes(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-600"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#0072BC] hover:bg-blue-700 text-white rounded-lg font-bold shadow-md shadow-blue-600/20"
                                >
                                    <LuSave size={15} />
                                    {isUpdating ? 'Saving Changes...' : 'Save & Update Invoice'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Product Selector Modal */}
            <ProductSelectModal
                isOpen={isProductSelectOpen}
                onClose={() => setIsProductSelectOpen(false)}
                onSelect={handleAddProductFromModal}
            />
        </div>
    );
};
