/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from 'react';
import { LuX, LuBuilding2, LuPhone, LuMail, LuMapPin, LuUser, LuDollarSign } from 'react-icons/lu';
import {
    useCreateWholesaleCustomerMutation,
    useUpdateWholesaleCustomerMutation,
    IWholesaleCustomer,
} from '@/redux/api/wholesaleApi';
import { toast } from 'react-hot-toast';

interface CustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    customerToEdit?: IWholesaleCustomer | null;
    onSuccess?: (createdCustomer: IWholesaleCustomer) => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
    isOpen,
    onClose,
    customerToEdit,
    onSuccess,
}) => {
    const [createCustomer, { isLoading: isCreating }] = useCreateWholesaleCustomerMutation();
    const [updateCustomer, { isLoading: isUpdating }] = useUpdateWholesaleCustomerMutation();

    const [formData, setFormData] = useState({
        businessName: '',
        contactName: '',
        phone: '',
        email: '',
        address: '',
        city: 'Dhaka',
        customerType: 'Book Shop' as any,
        openingBalance: 0,
        currentDue: 0,
        notes: '',
    });

    useEffect(() => {
        if (customerToEdit) {
            setFormData({
                businessName: customerToEdit.businessName || '',
                contactName: customerToEdit.contactName || '',
                phone: customerToEdit.phone || '',
                email: customerToEdit.email || '',
                address: customerToEdit.address || '',
                city: customerToEdit.city || 'Dhaka',
                customerType: customerToEdit.customerType || 'Book Shop',
                openingBalance: customerToEdit.openingBalance || 0,
                currentDue: customerToEdit.currentDue ?? 0,
                notes: customerToEdit.notes || '',
            });
        } else {
            setFormData({
                businessName: '',
                contactName: '',
                phone: '',
                email: '',
                address: '',
                city: 'Dhaka',
                customerType: 'Book Shop',
                openingBalance: 0,
                currentDue: 0,
                notes: '',
            });
        }
    }, [customerToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.businessName.trim()) {
            toast.error('Customer / Business name is required');
            return;
        }
        if (!formData.phone.trim()) {
            toast.error('Phone number is required');
            return;
        }
        if (!formData.address.trim()) {
            toast.error('Address is required');
            return;
        }

        try {
            if (customerToEdit?._id) {
                const res = await updateCustomer({ id: customerToEdit._id, body: formData }).unwrap();
                toast.success('Wholesale customer updated successfully!');
                if (onSuccess && res.data) onSuccess(res.data);
            } else {
                const res = await createCustomer(formData).unwrap();
                toast.success('Wholesale customer added successfully!');
                if (onSuccess && res.data) onSuccess(res.data);
            }
            onClose();
        } catch (err: any) {
            toast.error(err?.data?.message || 'Failed to save customer');
        }
    };

    const isLoading = isCreating || isUpdating;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-scaleUp">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-800 to-teal-800 text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white">
                            <LuBuilding2 size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-base">
                                {customerToEdit ? 'Edit Wholesale Customer' : 'Add New Wholesale Customer'}
                            </h3>
                            <p className="text-xs text-white/80">Store details, category & credit ledger</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <LuX size={20} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    {/* Business Name */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                            Business / Customer Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <LuBuilding2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="e.g. Baitul Hikmah Book Shop"
                                required
                                value={formData.businessName}
                                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-600 focus:bg-white transition-all font-semibold"
                            />
                        </div>
                    </div>

                    {/* Contact Person & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                Contact Person
                            </label>
                            <div className="relative">
                                <LuUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="e.g. Maulana Abdul Haque"
                                    value={formData.contactName}
                                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-600 focus:bg-white transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                Phone Number <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <LuPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="e.g. 01711223344"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-600 focus:bg-white transition-all font-semibold"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Email & Customer Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <LuMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="email"
                                    placeholder="customer@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-600 focus:bg-white transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                Customer Type
                            </label>
                            <select
                                value={formData.customerType}
                                onChange={(e) => setFormData({ ...formData, customerType: e.target.value as any })}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-600 focus:bg-white transition-all font-medium cursor-pointer"
                            >
                                <option value="Book Shop">Book Shop</option>
                                <option value="School">School</option>
                                <option value="Madrasah">Madrasah</option>
                                <option value="Retailer">Retailer</option>
                                <option value="Distributor">Distributor</option>
                                <option value="Corporate">Corporate</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    {/* Address & City */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                Address <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <LuMapPin className="absolute left-3 top-3 text-gray-400" size={16} />
                                <textarea
                                    rows={2}
                                    placeholder="Shop # / Road / Market"
                                    required
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-600 focus:bg-white transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                City
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Dhaka"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-600 focus:bg-white transition-all"
                            />
                        </div>
                    </div>

                    {/* Balance / Due Field */}
                    {customerToEdit ? (
                        <div className="bg-blue-50/70 p-3.5 rounded-lg border border-blue-200">
                            <label className="block text-xs font-bold text-[#0072BC] uppercase tracking-wider mb-1">
                                Customer Current Due (৳) — Direct Update
                            </label>
                            <div className="relative">
                                <LuDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0072BC]" size={16} />
                                <input
                                    type="number"
                                    placeholder="0"
                                    min="0"
                                    value={formData.currentDue}
                                    onChange={(e) => setFormData({ ...formData, currentDue: Number(e.target.value) })}
                                    className="w-full pl-9 pr-3 py-2 bg-white border border-blue-200 rounded-lg text-sm outline-none focus:border-[#0072BC] focus:ring-1 focus:ring-[#0072BC] transition-all font-bold text-red-600"
                                />
                            </div>
                            <p className="text-[11px] text-blue-900/80 mt-1 font-medium">
                                Directly updates customer ledger due and automatically synchronizes Total Paid.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                Opening Balance (Previous Due ৳)
                            </label>
                            <div className="relative">
                                <LuDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="number"
                                    placeholder="0"
                                    min="0"
                                    value={formData.openingBalance}
                                    onChange={(e) => setFormData({ ...formData, openingBalance: Number(e.target.value) })}
                                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-600 focus:bg-white transition-all font-bold"
                                />
                            </div>
                            <p className="text-[11px] text-gray-400 mt-1">If the customer has existing previous dues</p>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                            Notes / Remarks
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Payment terms, special instructions"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-600 focus:bg-white transition-all"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-5 py-2 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-all shadow-md shadow-emerald-700/20 disabled:opacity-50"
                        >
                            {isLoading ? 'Saving...' : customerToEdit ? 'Update Customer' : 'Add Customer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
