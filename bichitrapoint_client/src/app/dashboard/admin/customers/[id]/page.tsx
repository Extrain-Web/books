/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    LuArrowLeft,
    LuMail,
    LuPhone,
    LuCalendar,
    LuShield,
    LuUserCheck,
    LuUserX,
    LuShoppingBag,
    LuCreditCard,
    LuMapPin,
    LuEye,
    LuRefreshCw,
    LuClock,
    LuCircleCheck,
    LuCircleAlert,
    LuPencil,
    LuTrash2,
    LuX,
} from 'react-icons/lu';
import {
    useGetAdminUserByIdQuery,
    useUpdateUserMutation,
    useDeleteUserMutation,
} from '@/redux/api/userApi';
import { useGetAdminOrdersQuery } from '@/redux/api/orderApi';
import { toast } from 'react-hot-toast';

const RoleBadge = ({ role }: { role: string }) => {
    const isAdm = role === 'admin' || role === 'super_admin';
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isAdm
                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}
        >
            <LuShield size={12} />
            {role === 'super_admin' ? 'Super Admin' : isAdm ? 'Admin' : 'Customer'}
        </span>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const isAct = status === 'active';
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize ${isAct
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                : 'bg-red-100 text-red-700 border border-red-200'
                }`}
        >
            {isAct ? <LuCircleCheck size={12} /> : <LuCircleAlert size={12} />}
            {status || 'Active'}
        </span>
    );
};

const OrderStatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { bg: string; text: string }> = {
        pending: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
        confirmed: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
        processing: { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700' },
        shipped: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
        delivered: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
        cancelled: { bg: 'bg-red-50 border-red-200', text: 'text-red-700' },
        returned: { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-700' },
    };
    const s = map[status?.toLowerCase()] || { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-700' };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${s.bg} ${s.text}`}>
            {status || 'Pending'}
        </span>
    );
};

export default function CustomerDetailPage() {
    const { id } = useParams();
    const router = useRouter();

    const { data: userResponse, isLoading, isError, refetch } = useGetAdminUserByIdQuery(id);
    const user = userResponse?.data;

    // Fetch orders related to this user by email / userId
    const { data: ordersResponse, isLoading: isOrdersLoading } = useGetAdminOrdersQuery(
        { search: user?.email || (typeof id === 'string' ? id : ''), limit: 50 },
        { skip: !user && !id }
    );
    const orders: any[] = ordersResponse?.data?.orders || ordersResponse?.data || [];

    const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
    const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

    const [editingRole, setEditingRole] = useState(false);
    const [selectedRole, setSelectedRole] = useState('');

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'block' | 'activate' | 'delete';
        title: string;
        description: string;
        confirmText: string;
        confirmColor: string;
        onConfirm: () => Promise<void>;
    }>({
        isOpen: false,
        type: 'block',
        title: '',
        description: '',
        confirmText: '',
        confirmColor: '',
        onConfirm: async () => {},
    });

    const openToggleStatusModal = () => {
        if (!user) return;
        const newStatus = user.status === 'active' ? 'blocked' : 'active';
        const isBlock = newStatus === 'blocked';

        setConfirmModal({
            isOpen: true,
            type: isBlock ? 'block' : 'activate',
            title: isBlock ? 'Block User Account' : 'Activate User Account',
            description: isBlock
                ? `Are you sure you want to block ${user.firstName} ${user.lastName}? This user will not be able to log in or place new orders.`
                : `Are you sure you want to reactivate ${user.firstName} ${user.lastName}'s account?`,
            confirmText: isBlock ? 'Yes, Block Account' : 'Yes, Activate Account',
            confirmColor: isBlock
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white',
            onConfirm: async () => {
                try {
                    const res = await updateUser({ id: user._id, status: newStatus }).unwrap();
                    if (!res.success) {
                        toast.error(res.message);
                        return;
                    }
                    toast.success(res.message || `User account is now ${newStatus}`);
                    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                    refetch();
                } catch (err: any) {
                    toast.error(err?.data?.message || 'Failed to update user status');
                }
            },
        });
    };

    const openDeleteModal = () => {
        if (!user) return;
        setConfirmModal({
            isOpen: true,
            type: 'delete',
            title: 'Delete User Account',
            description: `Are you sure you want to permanently delete ${user.firstName} ${user.lastName}? This action cannot be undone and will permanently remove their profile.`,
            confirmText: 'Yes, Delete Account',
            confirmColor: 'bg-red-600 hover:bg-red-700 text-white',
            onConfirm: async () => {
                try {
                    const res = await deleteUser(user._id).unwrap();
                    if (!res.success) {
                        toast.error(res.message);
                        return;
                    }
                    toast.success(res.message || 'User deleted successfully');
                    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                    router.push('/dashboard/admin/customers');
                } catch (err: any) {
                    toast.error(err?.data?.message || 'Failed to delete user');
                }
            },
        });
    };

    const handleSaveRole = async () => {
        if (!user || !selectedRole) return;
        try {
            const res = await updateUser({ id: user._id, role: selectedRole }).unwrap();
            if (!res.success) {
                toast.error(res.message);
                return;
            }
            toast.success(res.message || `User role updated to ${selectedRole}`);
            setEditingRole(false);
            refetch();
        } catch (err: any) {
            toast.error(err?.data?.message || 'Failed to update user role');
        }
    };

    // Calculate customer metrics
    const totalOrdersCount = orders.length;
    const totalSpent = orders.reduce((sum, ord) => sum + (Number(ord.totalAmount || ord.total || 0) || 0), 0);
    const completedOrders = orders.filter((o) => o.status === 'delivered').length;
    const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalSpent / totalOrdersCount) : 0;

    if (isLoading) {
        return (
            <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
                <div className="h-8 w-48 bg-slate-200 rounded-lg" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-28 bg-slate-100 rounded-2xl border border-slate-200" />
                    ))}
                </div>
                <div className="h-96 bg-slate-100 rounded-2xl border border-slate-200" />
            </div>
        );
    }

    if (isError || !user) {
        return (
            <div className="p-6 sm:p-12 max-w-xl mx-auto text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto">
                    <LuCircleAlert size={32} />
                </div>
                <h1 className="text-xl font-bold text-slate-800">Customer Not Found</h1>
                <p className="text-sm text-slate-500">
                    The requested user profile does not exist or has been removed.
                </p>
                <div className="pt-2">
                    <Link
                        href="/dashboard/admin/customers"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-dark)] transition-colors"
                    >
                        <LuArrowLeft size={16} /> Back to Users List
                    </Link>
                </div>
            </div>
        );
    }

    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Valued Customer';
    const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U';

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
            {/* ═══ TOP BAR ═══ */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/admin/customers"
                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 flex items-center justify-center transition-all shadow-sm"
                        title="Back to Customers"
                    >
                        <LuArrowLeft size={18} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                {fullName}
                            </h1>
                            <RoleBadge role={user.role} />
                            <StatusBadge status={user.status} />
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Customer ID: <span className="font-mono text-slate-700">{user._id}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => refetch()}
                        className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-all shadow-sm"
                    >
                        <LuRefreshCw size={14} /> Refresh
                    </button>

                    <button
                        onClick={openToggleStatusModal}
                        disabled={isUpdating}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${user.status === 'active'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            }`}
                    >
                        {user.status === 'active' ? (
                            <>
                                <LuUserX size={14} /> Block Account
                            </>
                        ) : (
                            <>
                                <LuUserCheck size={14} /> Activate Account
                            </>
                        )}
                    </button>

                    <button
                        onClick={openDeleteModal}
                        disabled={isDeleting}
                        className="px-3.5 py-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                        <LuTrash2 size={14} /> Delete
                    </button>
                </div>
            </div>

            {/* ═══ STAT METRICS ═══ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <LuShoppingBag size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Orders</p>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900">{totalOrdersCount}</h3>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <LuCreditCard size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Spent</p>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900">৳{totalSpent.toLocaleString()}</h3>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <LuCircleCheck size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed</p>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900">{completedOrders}</h3>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <LuClock size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Order Value</p>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900">৳{avgOrderValue.toLocaleString()}</h3>
                    </div>
                </div>
            </div>

            {/* ═══ PROFILE & CONTACT DETAILS ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User Info Card */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
                    <div className="flex items-center gap-4">
                        {user.avatar ? (
                            <img
                                src={user.avatar}
                                alt={fullName}
                                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white font-black text-xl flex items-center justify-center shadow-md">
                                {initials}
                            </div>
                        )}
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">{fullName}</h2>
                            <p className="text-xs text-slate-400">Account #{user._id.slice(-6).toUpperCase()}</p>
                            <div className="mt-1.5 flex items-center gap-2">
                                <StatusBadge status={user.status} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-100 text-sm">
                        <div className="flex items-center justify-between py-1">
                            <span className="text-slate-400 flex items-center gap-2 text-xs font-medium">
                                <LuMail size={14} /> Email Address
                            </span>
                            <span className="font-semibold text-slate-800 break-all text-xs sm:text-sm">{user.email || 'N/A'}</span>
                        </div>

                        <div className="flex items-center justify-between py-1">
                            <span className="text-slate-400 flex items-center gap-2 text-xs font-medium">
                                <LuPhone size={14} /> Phone Number
                            </span>
                            <span className="font-semibold text-slate-800 text-xs sm:text-sm">{user.phone || 'N/A'}</span>
                        </div>

                        <div className="flex items-center justify-between py-1">
                            <span className="text-slate-400 flex items-center gap-2 text-xs font-medium">
                                <LuCalendar size={14} /> Member Since
                            </span>
                            <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                                {user.createdAt
                                    ? new Date(user.createdAt).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                    })
                                    : 'N/A'}
                            </span>
                        </div>

                        <div className="flex items-center justify-between py-1">
                            <span className="text-slate-400 flex items-center gap-2 text-xs font-medium">
                                <LuShield size={14} /> Role
                            </span>
                            {editingRole ? (
                                <div className="flex items-center gap-1.5">
                                    <select
                                        defaultValue={user.role}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                        className="text-xs font-bold border border-slate-300 rounded px-2 py-1 outline-none"
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <button
                                        onClick={handleSaveRole}
                                        disabled={isUpdating}
                                        className="text-xs bg-[var(--color-primary)] text-white px-2 py-1 rounded font-bold hover:bg-[var(--color-primary-dark)]"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setEditingRole(false)}
                                        className="text-xs text-slate-400 hover:text-slate-600 px-1"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <RoleBadge role={user.role} />
                                    <button
                                        onClick={() => {
                                            setSelectedRole(user.role);
                                            setEditingRole(true);
                                        }}
                                        className="text-slate-400 hover:text-[var(--color-primary)] transition-colors p-1"
                                        title="Edit Role"
                                    >
                                        <LuPencil size={13} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Saved Addresses (if any) */}
                    {user.addresses && user.addresses.length > 0 && (
                        <div className="pt-4 border-t border-slate-100">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                                <LuMapPin size={14} /> Saved Addresses ({user.addresses.length})
                            </h3>
                            <div className="space-y-2">
                                {user.addresses.map((addr: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-700 space-y-1"
                                    >
                                        <div className="flex items-center justify-between font-bold text-slate-800">
                                            <span>{addr.label || `Address #${idx + 1}`}</span>
                                            {addr.isDefault && (
                                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-slate-600 leading-relaxed">
                                            {[addr.street, addr.area, addr.city, addr.postalCode].filter(Boolean).join(', ')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Orders History Table */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <LuShoppingBag size={16} />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-900">Order History</h2>
                                <p className="text-xs text-slate-400">Past purchases placed by this customer</p>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                            {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
                        </span>
                    </div>

                    <div className="overflow-x-auto flex-1">
                        {isOrdersLoading ? (
                            <div className="p-8 text-center text-sm text-slate-400">Loading order history...</div>
                        ) : orders.length === 0 ? (
                            <div className="p-12 text-center space-y-2">
                                <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
                                    <LuShoppingBag size={22} />
                                </div>
                                <p className="text-sm font-semibold text-slate-700">No orders found</p>
                                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                    This customer hasn&apos;t placed any orders yet or orders were made with guest checkout.
                                </p>
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-5 py-3">Order ID</th>
                                        <th className="px-5 py-3">Date</th>
                                        <th className="px-5 py-3">Items</th>
                                        <th className="px-5 py-3">Total</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {orders.map((ord: any) => {
                                        const itemCount = ord.items?.length || 1;
                                        return (
                                            <tr key={ord._id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <span className="font-mono font-bold text-slate-800 text-xs">
                                                        {ord.orderId || ord.orderNumber || ord._id.slice(-8).toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-xs text-slate-500">
                                                    {ord.createdAt
                                                        ? new Date(ord.createdAt).toLocaleDateString('en-GB', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })
                                                        : '—'}
                                                </td>
                                                <td className="px-5 py-3.5 text-xs text-slate-700 font-medium">
                                                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                                                </td>
                                                <td className="px-5 py-3.5 font-bold text-slate-900 text-xs">
                                                    ৳{(Number(ord.totalAmount || ord.total || 0) || 0).toLocaleString()}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <OrderStatusBadge status={ord.status} />
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <Link
                                                        href={`/dashboard/admin/orders/${ord._id}`}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/40 text-xs font-bold transition-all shadow-sm"
                                                    >
                                                        <LuEye size={13} /> View
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══ CUSTOM ACTION CONFIRMATION MODAL ═══ */}
            {confirmModal.isOpen && (
                <div
                    className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl w-full max-w-md p-6 sm:p-7 shadow-2xl relative border border-slate-100"
                        style={{ animation: 'fadeIn 0.2s ease-out' }}
                    >
                        {/* Close cross */}
                        <button
                            onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors"
                        >
                            <LuX size={16} />
                        </button>

                        <div className="flex items-start gap-4 mb-5">
                            <div
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                    confirmModal.type === 'delete'
                                        ? 'bg-red-50 text-red-600'
                                        : confirmModal.type === 'block'
                                        ? 'bg-amber-50 text-amber-600'
                                        : 'bg-emerald-50 text-emerald-600'
                                }`}
                            >
                                {confirmModal.type === 'delete' ? (
                                    <LuTrash2 size={22} />
                                ) : confirmModal.type === 'block' ? (
                                    <LuUserX size={22} />
                                ) : (
                                    <LuUserCheck size={22} />
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{confirmModal.title}</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Please review before continuing</p>
                            </div>
                        </div>

                        <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                            {confirmModal.description}
                        </p>

                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                                disabled={isUpdating || isDeleting}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmModal.onConfirm}
                                disabled={isUpdating || isDeleting}
                                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-60 ${confirmModal.confirmColor}`}
                            >
                                {(isUpdating || isDeleting) && <LuRefreshCw size={14} className="animate-spin" />}
                                {confirmModal.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }`}</style>
        </div>
    );
}
