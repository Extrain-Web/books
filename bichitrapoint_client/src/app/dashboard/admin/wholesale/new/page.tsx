/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    LuArrowLeft,
    LuBuilding2,
    LuPlus,
    LuTrash2,
    LuShoppingBag,
    LuSave,
} from 'react-icons/lu';
import {
    useGetWholesaleCustomersQuery,
    useCreateWholesaleOrderMutation,
} from '@/redux/api/wholesaleApi';
import { CustomerModal } from '@/components/wholesale/CustomerModal';
import { ProductSelectModal } from '@/components/wholesale/ProductSelectModal';
import { toast } from 'react-hot-toast';

export default function CreateWholesaleOrderPage() {
    const router = useRouter();
    const { data: customersData } = useGetWholesaleCustomersQuery({ limit: 100 });
    const [createOrder, { isLoading: isCreating }] = useCreateWholesaleOrderMutation();

    // Modals
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);

    // Selected Customer
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const customers = customersData?.data || [];
    const selectedCustomer = customers.find((c) => c._id === selectedCustomerId);

    // Order Items
    const [items, setItems] = useState<
        Array<{
            product: string;
            name: string;
            sku: string;
            thumbnail: string;
            variantLabel?: string;
            quantity: number;
            unitPrice: number;
            retailPrice: number;
        }>
    >([]);

    // Financial calculations
    const [discount, setDiscount] = useState<number>(0);
    const [deliveryCharge, setDeliveryCharge] = useState<number>(0);
    const [paidAmount, setPaidAmount] = useState<number>(0);

    // Metadata
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [orderStatus, setOrderStatus] = useState('confirmed');
    const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
    const [dueDate, setDueDate] = useState('');
    const [paymentTerms, setPaymentTerms] = useState('Payment due within 15 days of invoice date.');
    const [returnPolicy, setReturnPolicy] = useState('Damaged or defective goods must be notified within 48 hours of delivery.');
    const [notes, setNotes] = useState('');

    // Calculated values
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const grandTotal = Math.max(0, subtotal - discount + deliveryCharge);
    const dueAmount = Math.max(0, grandTotal - paidAmount);

    const handleAddItem = (newItem: any) => {
        // If product already in list with same variant, increase quantity
        const existingIdx = items.findIndex(
            (it) => it.product === newItem.product && it.variantLabel === newItem.variantLabel
        );
        if (existingIdx > -1) {
            const updated = [...items];
            updated[existingIdx].quantity += newItem.quantity;
            setItems(updated);
        } else {
            setItems([...items, newItem]);
        }
        toast.success(`Added ${newItem.name}`);
    };

    const handleItemPriceChange = (index: number, newPrice: number) => {
        const updated = [...items];
        updated[index].unitPrice = Math.max(0, newPrice);
        setItems(updated);
    };

    const handleItemQuantityChange = (index: number, newQty: number) => {
        const updated = [...items];
        updated[index].quantity = Math.max(1, newQty);
        setItems(updated);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedCustomerId) {
            toast.error('Please select a wholesale customer');
            return;
        }

        if (items.length === 0) {
            toast.error('Please add at least one product to the order');
            return;
        }

        try {
            const payload = {
                customerId: selectedCustomerId,
                items,
                discount: Number(discount) || 0,
                deliveryCharge: Number(deliveryCharge) || 0,
                paidAmount: Number(paidAmount) || 0,
                paymentMethod,
                orderStatus,
                orderDate: orderDate ? new Date(orderDate) : new Date(),
                dueDate: dueDate ? new Date(dueDate) : null,
                paymentTerms,
                returnPolicy,
                notes,
            };

            const res = await createOrder(payload).unwrap();
            toast.success('Wholesale Order & Invoice created!');
            if (res?.data?._id) {
                router.push(`/dashboard/admin/wholesale/invoices/${res.data._id}`);
            } else {
                router.push('/dashboard/admin/wholesale');
            }
        } catch (err: any) {
            toast.error(err?.data?.message || 'Failed to create wholesale order');
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div>
                    <Link
                        href="/dashboard/admin/wholesale"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 mb-1 transition-colors"
                    >
                        <LuArrowLeft size={14} /> Back to Wholesale Orders
                    </Link>
                    <h1 className="text-2xl font-black text-gray-900">Create Wholesale Order</h1>
                    <p className="text-xs text-gray-500">
                        Select wholesale customer, products with automatic wholesale pricing, and generate invoice.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Customer Selection Card */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                            <LuBuilding2 size={18} />
                            <span>1. Wholesale Customer</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsCustomerModalOpen(true)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg transition-colors"
                        >
                            <LuPlus size={14} /> + New Customer
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                Select Wholesale Customer <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={selectedCustomerId}
                                onChange={(e) => setSelectedCustomerId(e.target.value)}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold outline-none focus:border-emerald-600 focus:bg-white transition-all cursor-pointer"
                            >
                                <option value="">-- Choose Existing Customer --</option>
                                {customers.map((c) => (
                                    <option key={c._id} value={c._id}>
                                        {c.businessName} ({c.customerType}) — {c.phone}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Customer Quick Summary */}
                        {selectedCustomer ? (
                            <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3.5 text-xs text-gray-700 space-y-1">
                                <div className="flex justify-between">
                                    <span className="font-bold text-emerald-900 text-sm">{selectedCustomer.businessName}</span>
                                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                                        {selectedCustomer.customerType}
                                    </span>
                                </div>
                                <p className="text-gray-600">
                                    Phone: <span className="font-semibold">{selectedCustomer.phone}</span>
                                    {selectedCustomer.contactName ? ` • Contact: ${selectedCustomer.contactName}` : ''}
                                </p>
                                <p className="text-gray-500">{selectedCustomer.address}{selectedCustomer.city ? `, ${selectedCustomer.city}` : ''}</p>
                                <div className="pt-1 border-t border-emerald-200 flex justify-between font-semibold">
                                    <span>Current Ledger Due:</span>
                                    <span className={selectedCustomer.currentDue > 0 ? 'text-red-600 font-bold' : 'text-emerald-700 font-bold'}>
                                        ৳ {selectedCustomer.currentDue.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center p-3.5 border border-dashed border-gray-200 rounded-lg text-xs text-gray-400">
                                Please select or create a wholesale customer
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Order Items Card */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                            <LuShoppingBag size={18} />
                            <span>2. Products & Wholesale Pricing</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsProductModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition-all shadow-md shadow-emerald-700/20"
                        >
                            <LuPlus size={16} /> Add Product to Order
                        </button>
                    </div>

                    {items.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                            <LuShoppingBag size={36} className="mx-auto text-gray-300 mb-2" />
                            <h4 className="text-sm font-bold text-gray-700">No items added yet</h4>
                            <p className="text-xs text-gray-400 mt-0.5">Click &quot;Add Product to Order&quot; to pick products with wholesale pricing.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                                        <th className="py-2.5 px-3 w-10 text-center">SL</th>
                                        <th className="py-2.5 px-3">Product Name</th>
                                        <th className="py-2.5 px-3 text-center">Variant / SKU</th>
                                        <th className="py-2.5 px-3 text-center w-24">Quantity</th>
                                        <th className="py-2.5 px-3 text-right w-32">Wholesale Unit (৳)</th>
                                        <th className="py-2.5 px-3 text-right w-32">Line Total</th>
                                        <th className="py-2.5 px-3 text-center w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50">
                                            <td className="py-2.5 px-3 text-center font-bold text-gray-400">{idx + 1}</td>
                                            <td className="py-2.5 px-3">
                                                <p className="font-bold text-gray-900">{item.name}</p>
                                                {item.retailPrice > item.unitPrice && (
                                                    <p className="text-[10px] text-gray-400">Retail MRP: ৳{item.retailPrice}</p>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-3 text-center text-gray-600">
                                                {item.variantLabel || item.sku || '—'}
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemQuantityChange(idx, Number(e.target.value))}
                                                    className="w-20 px-2 py-1 bg-white border border-gray-200 rounded font-bold text-center outline-none focus:border-emerald-600"
                                                />
                                            </td>
                                            <td className="py-2.5 px-3 text-right">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={item.unitPrice}
                                                    onChange={(e) => handleItemPriceChange(idx, Number(e.target.value))}
                                                    className="w-28 px-2 py-1 bg-emerald-50/40 border border-emerald-300 rounded font-bold text-right text-emerald-900 outline-none focus:border-emerald-600"
                                                    title="Authorized to override wholesale unit price"
                                                />
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                                                ৳ {(item.quantity * item.unitPrice).toLocaleString()}
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(idx)}
                                                    className="text-red-400 hover:text-red-600 p-1 transition-colors"
                                                >
                                                    <LuTrash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* 3. Calculations & Order Meta Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Metadata & Terms */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 text-xs">
                        <h4 className="font-bold text-sm text-gray-800 border-b pb-2">3. Payment & Policy Details</h4>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Invoice Date
                                </label>
                                <input
                                    type="date"
                                    value={orderDate}
                                    onChange={(e) => setOrderDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-emerald-600 font-medium"
                                />
                            </div>
                            <div>
                                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Due Date (Optional)
                                </label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-emerald-600 font-medium"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Payment Method
                                </label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-emerald-600 font-medium cursor-pointer"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="bkash">bKash</option>
                                    <option value="nagad">Nagad</option>
                                    <option value="cheque">Cheque</option>
                                    <option value="credit">Credit (Unpaid)</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Order Status
                                </label>
                                <select
                                    value={orderStatus}
                                    onChange={(e) => setOrderStatus(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-emerald-600 font-medium cursor-pointer"
                                >
                                    <option value="confirmed">Confirmed</option>
                                    <option value="processing">Processing</option>
                                    <option value="delivered">Delivered</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                                Payment Terms
                            </label>
                            <input
                                type="text"
                                value={paymentTerms}
                                onChange={(e) => setPaymentTerms(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-emerald-600 font-medium"
                            />
                        </div>

                        <div>
                            <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                                Return / Exchange Policy
                            </label>
                            <input
                                type="text"
                                value={returnPolicy}
                                onChange={(e) => setReturnPolicy(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-emerald-600 font-medium"
                            />
                        </div>

                        <div>
                            <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                                Notes & Special Instructions
                            </label>
                            <textarea
                                rows={2}
                                placeholder="Any additional notes for this order"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-emerald-600"
                            />
                        </div>
                    </div>

                    {/* Right: Totals Calculation Card */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 text-xs flex flex-col justify-between">
                        <div className="space-y-3">
                            <h4 className="font-bold text-sm text-gray-800 border-b pb-2">4. Financial Summary</h4>

                            <div className="flex justify-between items-center py-1">
                                <span className="text-gray-600 font-medium">Subtotal ({items.length} items):</span>
                                <span className="font-bold text-sm text-gray-900">৳ {subtotal.toLocaleString()}</span>
                            </div>

                            <div className="flex justify-between items-center py-1">
                                <span className="text-gray-600 font-medium">Wholesale Discount (৳):</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={discount}
                                    onChange={(e) => setDiscount(Number(e.target.value))}
                                    className="w-28 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded text-right font-bold text-red-600 outline-none focus:border-emerald-600"
                                />
                            </div>

                            <div className="flex justify-between items-center py-1">
                                <span className="text-gray-600 font-medium">Delivery Charge (৳):</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={deliveryCharge}
                                    onChange={(e) => setDeliveryCharge(Number(e.target.value))}
                                    className="w-28 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded text-right font-bold text-gray-800 outline-none focus:border-emerald-600"
                                />
                            </div>

                            <div className="flex justify-between items-center py-2.5 border-t border-b border-emerald-800 text-sm font-black text-emerald-900 bg-emerald-50/50 px-3 rounded">
                                <span>Grand Total:</span>
                                <span>৳ {grandTotal.toLocaleString()}</span>
                            </div>

                            <div className="flex justify-between items-center py-1">
                                <span className="text-emerald-800 font-bold">Paid / Advance Amount (৳):</span>
                                <input
                                    type="number"
                                    min="0"
                                    max={grandTotal}
                                    value={paidAmount}
                                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                                    className="w-32 px-2.5 py-1.5 bg-emerald-50 border border-emerald-300 rounded text-right font-black text-emerald-900 text-sm outline-none focus:border-emerald-600"
                                />
                            </div>

                            <div className="flex justify-between items-center py-2 bg-gray-50 border border-gray-200 px-3 rounded font-bold text-xs">
                                <span className={dueAmount > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                                    {dueAmount > 0 ? 'Current Invoice Due:' : 'Current Invoice Paid:'}
                                </span>
                                <span className={dueAmount > 0 ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}>
                                    ৳ {dueAmount.toLocaleString()}
                                </span>
                            </div>

                            <div className="flex justify-between items-center py-1.5 px-3 bg-red-50/70 border border-red-100 rounded text-xs">
                                <span className="text-red-700 font-semibold">Previous Due Amount:</span>
                                <span className="text-red-700 font-bold">
                                    ৳ {(selectedCustomer?.currentDue || 0).toLocaleString()}
                                </span>
                            </div>

                            <div className="flex justify-between items-center py-2.5 bg-gray-900 text-white px-3 rounded-lg font-bold text-xs shadow-sm">
                                <span>Total Customer Due:</span>
                                <span className="text-sm font-black text-amber-300">
                                    ৳ {((selectedCustomer?.currentDue || 0) + dueAmount).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isCreating}
                            className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                        >
                            <LuSave size={18} />
                            {isCreating ? 'Generating Wholesale Invoice...' : 'Generate & Issue Wholesale Invoice'}
                        </button>
                    </div>
                </div>
            </form>

            {/* Modals */}
            <CustomerModal
                isOpen={isCustomerModalOpen}
                onClose={() => setIsCustomerModalOpen(false)}
                onSuccess={(newCust) => setSelectedCustomerId(newCust._id)}
            />

            <ProductSelectModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                onSelect={handleAddItem}
            />
        </div>
    );
}
