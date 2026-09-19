"use client";

import { useAppSelector, useAppDispatch } from '@/redux';
import { useGetWishlistQuery, useToggleWishlistMutation } from '@/redux/api/userApi';
import { toggleWishlist as toggleLocalWishlist } from '@/redux/slices/wishlistSlice';

import { toast } from 'react-hot-toast';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Single source of truth for the wishlist across the whole app.
 * - Logged-in users  → server wishlist (useGetWishlistQuery / toggle mutation)
 * - Guests           → local wishlist slice (localStorage-backed)
 * Use this everywhere (header count badge, product card, product detail) so the
 * count + "is in wishlist" state stay consistent.
 */
export function useWishlist() {
    const dispatch = useAppDispatch();
    const { isAuthenticated } = useAppSelector((s: any) => s.auth);
    const localItems = useAppSelector((s: any) => s.wishlist.items) as any[];

    const { data: serverWishlist } = useGetWishlistQuery({}, { skip: !isAuthenticated });
    const [toggleApi] = useToggleWishlistMutation();

    const serverItems: any[] = serverWishlist?.data || [];

    const ids: string[] = isAuthenticated
        ? serverItems.map((it) => String(it._id || it.id))
        : localItems.map((it) => String(it.id));

    const count = ids.length;
    const isInWishlist = (id: string | number) => ids.includes(String(id));

    const toggle = async (product: any) => {
        const id = String(product._id || product.id);
        const wasInWishlist = isInWishlist(id);
        if (isAuthenticated) {
            const toastId = toast.loading(wasInWishlist ? 'Removing from wishlist...' : 'Adding to wishlist...');
            try {
                const res = await toggleApi(id).unwrap();

                if (!res.success) {
                    toast.error(res?.message || 'Failed to update wishlist', { id: toastId });
                    return;
                }

                toast.success(res?.message || (wasInWishlist ? 'Removed from wishlist' : 'Added to wishlist successfully!'), { id: toastId });
            } catch (err: any) {
                console.error('Wishlist toggle failed:', err);
                toast.error(err?.data?.message || err?.message || 'Failed to update wishlist', { id: toastId });
            }
        } else {
            dispatch(
                toggleLocalWishlist({
                    id,
                    name: product.name,
                    price: product.price,
                    mrp: product.originalPrice || product.mrp || product.price,
                    image: product.thumbnail || product.images?.[0] || product.image || '',
                    category: product.category?.name || product.categoryName || '',
                    rating: product.rating || 0,
                })
            );
            toast.success(wasInWishlist ? 'Removed from wishlist' : 'Added to wishlist successfully!');
        }
    };

    return { ids, count, isInWishlist, toggle, isAuthenticated };
}

export default useWishlist;
