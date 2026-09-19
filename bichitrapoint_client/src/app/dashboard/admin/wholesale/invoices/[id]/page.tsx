"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { useGetWholesaleOrderByIdQuery } from '@/redux/api/wholesaleApi';
import { InvoiceView } from '@/components/wholesale/InvoiceView';
import Link from 'next/link';
import { LuArrowLeft } from 'react-icons/lu';

export default function WholesaleInvoiceDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const { data: orderData, isLoading, error } = useGetWholesaleOrderByIdQuery(id, {
        skip: !id,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-2">
                    <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-gray-500 font-medium">Loading Wholesale Invoice...</p>
                </div>
            </div>
        );
    }

    if (error || !orderData?.data) {
        return (
            <div className="p-8 text-center bg-white rounded-xl border border-gray-200 shadow-sm max-w-lg mx-auto mt-12 space-y-4">
                <h3 className="text-base font-bold text-gray-800">Wholesale Invoice Not Found</h3>
                <p className="text-xs text-gray-500">The requested wholesale order or invoice could not be located.</p>
                <Link
                    href="/dashboard/admin/wholesale"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors"
                >
                    <LuArrowLeft size={14} /> Back to Wholesale Orders
                </Link>
            </div>
        );
    }

    return <InvoiceView order={orderData.data} />;
}
