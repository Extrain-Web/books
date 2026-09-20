/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
    LuPlus,
    LuSearch,
    LuPencil,
    LuTrash2,
    LuDollarSign,
    LuUsers,
    LuCircleAlert,
    LuArrowLeft,
    LuRefreshCw,
    LuX,
    LuCheck,
} from 'react-icons/lu';
import {
    useGetWholesaleCustomersQuery,
    useUpdateWholesaleCustomerMutation,
    useDeleteWholesaleCustomerMutation,
    IWholesaleCustomer,
} from '@/redux/api/wholesaleApi';
import { CustomerModal } from '@/components/wholesale/CustomerModal';
import { toast } from 'react-hot-toast';

export default function WholesaleCustomersPage() {
    const [search, setSearch] = useState('');
    const [customerType, setCustomerType] = useState('');
    const [page, setPage] = useState(1);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState<IWholesaleCustomer | null>(null);

    // Quick Due Update Modal state
    const [dueModalCustomer, setDueModalCustomer] = useState<IWholesaleCustomer | null>(null);
    const [newDueAmount, setNewDueAmount] = useState<number>(0);

    const { data: customersData, isLoading, refetch } = useGetWholesaleCustomersQuery({
        search,
        customerType: customerType || undefined,
        page,
        limit: 20,
    });

    const [updateCustomer, { isLoading: isUpdatingDue }] = useUpdateWholesaleCustomerMutation();
    const [deleteCustomer] = useDeleteWholesaleCustomerMutation();

    const customers = customersData?.data || [];
    const meta = customersData?.meta || { total: 0, totalPages: 1 };

    const totalDues = customers.reduce((sum, c) => sum + (c.currentDue || 0), 0);
    const totalBilled = customers.reduce((sum, c) => sum + (c.totalBilled || 0), 0);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete wholesale customer "${name}"?`)) return;
        try {
            await deleteCustomer(id).unwrap();
            toast.success('Customer deleted');
        } catch (err: any) {
            toast.error(err?.data?.message || 'Failed to delete customer');
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Book Shop':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'School':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'Madrasah':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'Distributor':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'Corporate':
                return 'bg-cyan-100 text-cyan-800 border-cyan-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const handleOpenDueModal = (cust: IWholesaleCustomer) => {
        setDueModalCustomer(cust);
        setNewDueAmount(cust.currentDue || 0);
    };

    const handleSaveQuickDue = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!dueModalCustomer) return;
        try {
            await updateCustomer({
                id: dueModalCustomer._id,
                body: { currentDue: Math.max(0, Number(newDueAmount) || 0) },
            }).unwrap();
            toast.success(`Current due updated for ${dueModalCustomer.businessName}`);
            setDueModalCustomer(null);
            refetch();
        } catch (err: any) {
            toast.error(err?.data?.message || 'Failed to update due amount');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div>
                    <Link
                        href="/dashboard/admin/wholesale"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 mb-1 transition-colors"
                    >
                        <LuArrowLeft size={14} /> Back to Wholesale Dashboard
                    </Link>
                    <h1 className="text-2xl font-black text-gray-900">Wholesale Customer Directory</h1>
                    <p className="text-xs text-gray-500">
                        Manage B2B accounts, book shops, schools, distributors, and monitor credit balances.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setCustomerToEdit(null);
                            setIsModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition-all shadow-md shadow-emerald-700/20"
                    >
                        <LuPlus size={16} /> Add Wholesale Customer
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total B2B Customers</p>
                        <h3 className="text-xl font-black text-gray-900 mt-0.5">{meta.total}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                        <LuUsers size={20} />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Page Sales Billed</p>
                        <h3 className="text-xl font-black text-emerald-800 mt-0.5">৳ {totalBilled.toLocaleString()}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                        <LuDollarSign size={20} />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Page Outstanding Due</p>
                        <h3 className="text-xl font-black text-red-600 mt-0.5">৳ {totalDues.toLocaleString()}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
                        <LuCircleAlert size={20} />
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
                <div className="relative w-full md:w-80">
                    <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search by business name, phone, contact..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-emerald-600 focus:bg-white transition-all font-medium"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <select
                        value={customerType}
                        onChange={(e) => setCustomerType(e.target.value)}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium outline-none focus:border-emerald-600 cursor-pointer"
                    >
                        <option value="">All Customer Types</option>
                        <option value="Book Shop">Book Shop</option>
                        <option value="School">School</option>
                        <option value="Madrasah">Madrasah</option>
                        <option value="Retailer">Retailer</option>
                        <option value="Distributor">Distributor</option>
                        <option value="Corporate">Corporate</option>
                        <option value="Other">Other</option>
                    </select>

                    <button
                        onClick={() => refetch()}
                        className="p-2 text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                        title="Refresh list"
                    >
                        <LuRefreshCw size={14} />
                    </button>
                </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                                <th className="py-3 px-4">Business / Customer Name</th>
                                <th className="py-3 px-4">Contact Person & Phone</th>
                                <th className="py-3 px-4">Address / Location</th>
                                <th className="py-3 px-4 text-center">Category</th>
                                <th className="py-3 px-4 text-center">Orders</th>
                                <th className="py-3 px-4 text-right">Total Billed</th>
                                <th className="py-3 px-4 text-right">Total Paid</th>
                                <th className="py-3 px-4 text-right">Current Due</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-12 text-gray-400">
                                        Loading wholesale customers...
                                    </td>
                                </tr>
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-12 text-gray-400">
                                        No wholesale customers found. Click &quot;Add Wholesale Customer&quot; to register one.
                                    </td>
                                </tr>
                            ) : (
                                customers.map((cust) => (
                                    <tr key={cust._id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="py-3 px-4 font-bold text-gray-900">
                                            {cust.businessName}
                                            {cust.email && <p className="text-[11px] font-normal text-gray-400">{cust.email}</p>}
                                        </td>
                                        <td className="py-3 px-4">
                                            <p className="font-semibold text-gray-800">{cust.phone}</p>
                                            {cust.contactName && <p className="text-[11px] text-gray-500">{cust.contactName}</p>}
                                        </td>
                                        <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                                            {cust.address}{cust.city ? `, ${cust.city}` : ''}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span
                                                className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getTypeColor(
                                                    cust.customerType
                                                )}`}
                                            >
                                                {cust.customerType}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center font-bold text-gray-700">
                                            {cust.totalOrders || 0}
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold text-gray-900">
                                            ৳ {(cust.totalBilled || 0).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                                            ৳ {(cust.totalPaid || 0).toLocaleString()}
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-bold">
                                            <span className={(cust.currentDue || 0) > 0 ? 'text-red-600 font-black text-sm' : 'text-emerald-700 font-bold'}>
                                                ৳ {(cust.currentDue || 0).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="inline-flex items-center gap-1.5 justify-end">
                                                <button
                                                    onClick={() => handleOpenDueModal(cust)}
                                                    className="p-1.5 text-[#0072BC] hover:text-white hover:bg-[#0072BC] bg-blue-50/80 border border-blue-200 rounded-lg transition-all"
                                                    title="Quick Update Due"
                                                >
                                                    <LuDollarSign size={15} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setCustomerToEdit(cust);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="p-1.5 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 bg-gray-50 border border-gray-200 rounded-lg transition-all"
                                                    title="Edit Full Profile"
                                                >
                                                    <LuPencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cust._id, cust.businessName)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 bg-gray-50 border border-gray-200 rounded-lg transition-all"
                                                    title="Delete Customer"
                                                >
                                                    <LuTrash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {meta.totalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                        <span>Showing Page {meta.page} of {meta.totalPages} ({meta.total} customers)</span>
                        <div className="flex gap-1">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(page - 1)}
                                className="px-3 py-1 border rounded bg-white hover:bg-gray-50 disabled:opacity-40"
                            >
                                Prev
                            </button>
                            <button
                                disabled={page >= meta.totalPages}
                                onClick={() => setPage(page + 1)}
                                className="px-3 py-1 border rounded bg-white hover:bg-gray-50 disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Due Update Modal (Blue Theme) */}
            {dueModalCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 animate-scaleUp">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#0072BC] to-blue-800 text-white">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white">
                                    <LuDollarSign size={18} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Update Customer Current Due</h3>
                                    <p className="text-[11px] text-white/80">{dueModalCustomer.businessName}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setDueModalCustomer(null)}
                                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <LuX size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleSaveQuickDue} className="p-6 space-y-4">
                            <div className="bg-blue-50/60 p-3.5 rounded-lg border border-blue-100 text-xs space-y-1.5">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Customer Phone:</span>
                                    <span className="font-semibold text-gray-800">{dueModalCustomer.phone}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Total Sales Billed:</span>
                                    <span className="font-semibold text-gray-800">৳ {(dueModalCustomer.totalBilled || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Existing Ledger Due:</span>
                                    <span className="font-bold text-red-600">৳ {(dueModalCustomer.currentDue || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between pt-1 border-t border-blue-100/80">
                                    <span className="text-blue-900 font-semibold">New Resulting Total Paid:</span>
                                    <span className="font-black text-emerald-700">
                                        ৳ {Math.max(0, Math.max((dueModalCustomer.totalBilled || 0) + (dueModalCustomer.openingBalance || 0), newDueAmount) - newDueAmount).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    New Current Due Amount (৳) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <LuDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0072BC]" size={18} />
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        autoFocus
                                        value={newDueAmount}
                                        onChange={(e) => setNewDueAmount(Math.max(0, Number(e.target.value)))}
                                        className="w-full pl-9 pr-3 py-2.5 bg-blue-50/20 border border-blue-200 rounded-lg text-base font-black text-red-600 outline-none focus:border-[#0072BC] focus:ring-1 focus:ring-[#0072BC] focus:bg-white transition-all"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Quick Shortcut Buttons */}
                            <div className="flex items-center gap-2 pt-1">
                                <span className="text-[11px] font-semibold text-gray-400">Quick set:</span>
                                <button
                                    type="button"
                                    onClick={() => setNewDueAmount(0)}
                                    className="px-2.5 py-1 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded transition-colors"
                                >
                                    Clear Due (৳ 0)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNewDueAmount(dueModalCustomer.currentDue || 0)}
                                    className="px-2.5 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                                >
                                    Reset
                                </button>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setDueModalCustomer(null)}
                                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdatingDue}
                                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#0072BC] hover:bg-blue-700 rounded-lg transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
                                >
                                    <LuCheck size={16} />
                                    {isUpdatingDue ? 'Updating...' : 'Save Current Due'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Customer Add/Edit Modal */}
            <CustomerModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setCustomerToEdit(null);
                }}
                customerToEdit={customerToEdit}
            />
        </div>
    );
}
