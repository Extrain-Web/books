/* eslint-disable @typescript-eslint/no-explicit-any */
import { baseApi } from './baseApi';

export interface IWholesaleCustomer {
    _id: string;
    businessName: string;
    contactName?: string;
    phone: string;
    email?: string;
    address: string;
    city?: string;
    customerType: 'Book Shop' | 'School' | 'Madrasah' | 'Retailer' | 'Distributor' | 'Corporate' | 'Other';
    openingBalance: number;
    totalOrders: number;
    totalBilled: number;
    totalPaid: number;
    currentDue: number;
    notes?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface IWholesaleOrderItem {
    _id?: string;
    product: string | { _id: string; name: string; thumbnail?: string; sku?: string };
    name: string;
    sku?: string;
    thumbnail?: string;
    variantLabel?: string;
    quantity: number;
    unitPrice: number;
    retailPrice: number;
    total: number;
}

export interface IWholesaleOrder {
    _id: string;
    invoiceNumber: string;
    customer: IWholesaleCustomer | string;
    customerSnapshot: {
        businessName: string;
        contactName?: string;
        phone: string;
        email?: string;
        address: string;
        city?: string;
        customerType?: string;
    };
    items: IWholesaleOrderItem[];
    subtotal: number;
    discount: number;
    deliveryCharge: number;
    grandTotal: number;
    paidAmount: number;
    dueAmount: number;
    previousDue?: number;
    paymentStatus: 'paid' | 'partial' | 'unpaid';
    orderStatus: 'confirmed' | 'processing' | 'delivered' | 'cancelled';
    paymentMethod: string;
    paymentTerms?: string;
    returnPolicy?: string;
    notes?: string;
    orderDate: string;
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
}

export interface IWholesaleStats {
    totalOrders: number;
    totalCustomers: number;
    totalBilled: number;
    totalPaid: number;
    totalDue: number;
    pendingDueCount: number;
}

export const wholesaleApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // ── Stats ──
        getWholesaleStats: builder.query<{ success: boolean; data: IWholesaleStats }, void>({
            query: () => '/wholesale/stats',
            providesTags: ['Wholesale'],
        }),

        // ── Product search for orders ──
        getWholesaleProducts: builder.query<{ success: boolean; data: any[] }, { search?: string }>({
            query: (params) => ({
                url: '/wholesale/products',
                params,
            }),
            providesTags: ['Products'],
        }),

        // ── Customers ──
        getWholesaleCustomers: builder.query<{ success: boolean; data: IWholesaleCustomer[]; meta: any }, Record<string, any>>({
            query: (params) => ({
                url: '/wholesale/customers',
                params,
            }),
            providesTags: ['Wholesale'],
        }),

        getWholesaleCustomerById: builder.query<{ success: boolean; data: { customer: IWholesaleCustomer; recentOrders: IWholesaleOrder[] } }, string>({
            query: (id) => `/wholesale/customers/${id}`,
            providesTags: (_res, _err, id) => [{ type: 'Wholesale', id }],
        }),

        createWholesaleCustomer: builder.mutation<{ success: boolean; data: IWholesaleCustomer }, Partial<IWholesaleCustomer>>({
            query: (body) => ({
                url: '/wholesale/customers',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Wholesale'],
        }),

        updateWholesaleCustomer: builder.mutation<{ success: boolean; data: IWholesaleCustomer }, { id: string; body: Partial<IWholesaleCustomer> }>({
            query: ({ id, body }) => ({
                url: `/wholesale/customers/${id}`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['Wholesale'],
        }),

        deleteWholesaleCustomer: builder.mutation<{ success: boolean; message: string }, string>({
            query: (id) => ({
                url: `/wholesale/customers/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Wholesale'],
        }),

        // ── Orders & Invoices ──
        getWholesaleOrders: builder.query<{ success: boolean; data: IWholesaleOrder[]; meta: any }, Record<string, any>>({
            query: (params) => ({
                url: '/wholesale/orders',
                params,
            }),
            providesTags: ['Wholesale'],
        }),

        getWholesaleOrderById: builder.query<{ success: boolean; data: IWholesaleOrder }, string>({
            query: (id) => `/wholesale/orders/${id}`,
            providesTags: (_res, _err, id) => [{ type: 'Wholesale', id }],
        }),

        createWholesaleOrder: builder.mutation<{ success: boolean; data: IWholesaleOrder }, any>({
            query: (body) => ({
                url: '/wholesale/orders',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Wholesale'],
        }),

        updateWholesaleOrder: builder.mutation<{ success: boolean; data: IWholesaleOrder }, { id: string; body: any }>({
            query: ({ id, body }) => ({
                url: `/wholesale/orders/${id}`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['Wholesale'],
        }),
    }),
});

export const {
    useGetWholesaleStatsQuery,
    useGetWholesaleProductsQuery,
    useGetWholesaleCustomersQuery,
    useGetWholesaleCustomerByIdQuery,
    useCreateWholesaleCustomerMutation,
    useUpdateWholesaleCustomerMutation,
    useDeleteWholesaleCustomerMutation,
    useGetWholesaleOrdersQuery,
    useGetWholesaleOrderByIdQuery,
    useCreateWholesaleOrderMutation,
    useUpdateWholesaleOrderMutation,
} = wholesaleApi;
