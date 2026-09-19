"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
    LuBuilding2,
    LuPlus,
    LuSearch,
    LuFileText,
    LuEye,
    LuCircleCheck,
    LuClock,
    LuCircleAlert,
    LuUsers,
    LuDollarSign,
    LuRefreshCw,
} from 'react-icons/lu';
import {
    useGetWholesaleOrdersQuery,
    useGetWholesaleStatsQuery,
} from '@/redux/api/wholesaleApi';

export default function WholesaleOrdersPage() {
    const [search, setSearch] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [orderStatus, setOrderStatus] = useState('');
    const [page, setPage] = useState(1);

    const { data: statsData } = useGetWholesaleStatsQuery();
    const { data: ordersData, isLoading, refetch } = useGetWholesaleOrdersQuery({
        search,
        paymentStatus: paymentStatus || undefined,
        orderStatus: orderStatus || undefined,
        page,
        limit: 15,
    });

    const stats = statsData?.data || {
        totalOrders: 0,
        totalCustomers: 0,
        totalBilled: 0,
        totalPaid: 0,
        totalDue: 0,
        pendingDueCount: 0,
    };

    const orders = ordersData?.data || [];
    const meta = ordersData?.meta || { total: 0, totalPages: 1 };

    const getPaymentBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <LuCircleCheck size={12} /> Paid
                    </span>
                );
            case 'partial':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <LuClock size={12} /> Partial
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                        <LuCircleAlert size={12} /> Unpaid
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div>
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-1">
                        <LuBuilding2 size={16} /> B2B Commerce & Distribution
                    </div>
                    <h1 className="text-2xl font-black text-gray-900">Wholesale Management</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Track bulk orders, customer credit balances, and generate professional A4 invoices.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/admin/wholesale/customers"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-lg transition-all"
                    >
                        <LuUsers size={16} /> Wholesale Customers
                    </Link>
                    <Link
                        href="/dashboard/admin/wholesale/new"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition-all shadow-md shadow-emerald-700/20"
                    >
                        <LuPlus size={16} /> Create Wholesale Order
                    </Link>
                </div>
            </div>

            {/* Metrics Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Wholesale Billed</p>
                        <h3 className="text-xl font-black text-gray-900 mt-1">৳ {stats.totalBilled.toLocaleString()}</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">{stats.totalOrders} total invoices</p>
                    </div>
                    <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                        <LuDollarSign size={22} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Collected / Paid</p>
                        <h3 className="text-xl font-black text-emerald-700 mt-1">৳ {stats.totalPaid.toLocaleString()}</h3>
                        <p className="text-[11px] text-emerald-600 mt-0.5">Cleared payments</p>
                    </div>
                    <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                        <LuCircleCheck size={22} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Outstanding Dues</p>
                        <h3 className="text-xl font-black text-red-600 mt-1">৳ {stats.totalDue.toLocaleString()}</h3>
                        <p className="text-[11px] text-red-500 mt-0.5">{stats.pendingDueCount} orders with dues</p>
                    </div>
                    <div className="w-11 h-11 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
                        <LuCircleAlert size={22} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">B2B Customers</p>
                        <h3 className="text-xl font-black text-gray-900 mt-1">{stats.totalCustomers}</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">Book shops, schools, distributors</p>
                    </div>
                    <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                        <LuBuilding2 size={22} />
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
                <div className="relative w-full md:w-80">
                    <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search invoice #, customer name, phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-emerald-600 focus:bg-white transition-all font-medium"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <select
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium outline-none focus:border-emerald-600 cursor-pointer"
                    >
                        <option value="">All Payment Status</option>
                        <option value="paid">Paid</option>
                        <option value="partial">Partial</option>
                        <option value="unpaid">Unpaid</option>
                    </select>

                    <select
                        value={orderStatus}
                        onChange={(e) => setOrderStatus(e.target.value)}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium outline-none focus:border-emerald-600 cursor-pointer"
                    >
                        <option value="">All Order Status</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
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

            {/* Orders Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                                <th className="py-3 px-4">Invoice #</th>
                                <th className="py-3 px-4">Wholesale Customer</th>
                                <th className="py-3 px-4">Date</th>
                                <th className="py-3 px-4 text-center">Items</th>
                                <th className="py-3 px-4 text-right">Grand Total</th>
                                <th className="py-3 px-4 text-right">Paid</th>
                                <th className="py-3 px-4 text-right">Due Balance</th>
                                <th className="py-3 px-4 text-center">Payment Status</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-12 text-gray-400">
                                        Loading wholesale orders...
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-12 text-gray-400">
                                        No wholesale orders found. Click &quot;Create Wholesale Order&quot; to begin.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((ord) => {
                                    const snap = ord.customerSnapshot || {};
                                    const dateStr = new Date(ord.orderDate).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                    });

                                    return (
                                        <tr key={ord._id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="py-3 px-4 font-mono font-bold text-emerald-900">
                                                <Link
                                                    href={`/dashboard/admin/wholesale/invoices/${ord._id}`}
                                                    className="hover:underline flex items-center gap-1"
                                                >
                                                    <LuFileText size={14} className="text-emerald-700" />
                                                    {ord.invoiceNumber}
                                                </Link>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="font-bold text-gray-900">{snap.businessName}</p>
                                                <p className="text-[11px] text-gray-400">
                                                    {snap.phone} • {snap.customerType}
                                                </p>
                                            </td>
                                            <td className="py-3 px-4 text-gray-600">{dateStr}</td>
                                            <td className="py-3 px-4 text-center font-bold text-gray-700">
                                                {ord.items?.length || 0}
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold text-gray-900">
                                                ৳ {ord.grandTotal.toLocaleString()}
                                            </td>
                                            <td className="py-3 px-4 text-right text-emerald-700 font-semibold">
                                                ৳ {ord.paidAmount.toLocaleString()}
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold">
                                                <span className={ord.dueAmount > 0 ? 'text-red-600' : 'text-gray-400'}>
                                                    ৳ {ord.dueAmount.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {getPaymentBadge(ord.paymentStatus)}
                                            </td>
                                            <td className="py-3 px-4 text-right space-x-1">
                                                <Link
                                                    href={`/dashboard/admin/wholesale/invoices/${ord._id}`}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded text-[11px] transition-colors"
                                                    title="View & Print Invoice"
                                                >
                                                    <LuEye size={13} /> Invoice
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {meta.totalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                        <span>Showing Page {meta.page} of {meta.totalPages} ({meta.total} orders)</span>
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
        </div>
    );
}
