/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
    LuX,
    LuSearch,
    LuPackage,
    LuCheck,
    LuTriangleAlert,
    LuMinus,
    LuPlus,
    LuLayers,
    LuSparkles,
} from 'react-icons/lu';
import { useGetWholesaleProductsQuery } from '@/redux/api/wholesaleApi';

interface ProductSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (item: {
        product: string;
        name: string;
        sku: string;
        thumbnail: string;
        variantLabel?: string;
        quantity: number;
        unitPrice: number;
        retailPrice: number;
    }) => void;
}

export const ProductSelectModal: React.FC<ProductSelectModalProps> = ({
    isOpen,
    onClose,
    onSelect,
}) => {
    // ── 1. ALL HOOKS UNCONDITIONALLY AT THE TOP ──
    const [search, setSearch] = useState('');
    const { data: productsData, isLoading } = useGetWholesaleProductsQuery(
        { search },
        { skip: !isOpen }
    );

    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [quantity, setQuantity] = useState<string>('10');
    const [customUnitPrice, setCustomUnitPrice] = useState<string>('');

    const products = useMemo(() => productsData?.data || [], [productsData]);

    // Size / Variant list from selected product
    const sizeList = useMemo(() => {
        if (!selectedProduct) return [];
        const variants = selectedProduct.variants || [];
        if (variants.length > 0) {
            const sizes = variants
                .map((v: any) => v.size || v.label || [v.color, v.size].filter(Boolean).join(' / '))
                .filter(Boolean);
            return [...new Set(sizes)] as string[];
        }
        return (selectedProduct.sizes?.length > 0 ? selectedProduct.sizes : []) as string[];
    }, [selectedProduct]);

    // Active variant resolved from selected size
    const activeVariant = useMemo(() => {
        if (!selectedProduct) return null;
        const variants = selectedProduct.variants || [];
        if (variants.length === 0 || !selectedSize) return null; // Default to Standard / Normal base product

        return (
            variants.find(
                (v: any) =>
                    v.size === selectedSize ||
                    v.label === selectedSize ||
                    [v.color, v.size].filter(Boolean).join(' / ') === selectedSize
            ) || null
        );
    }, [selectedProduct, selectedSize]);

    // Auto-sync custom wholesale unit price when product or selected size changes
    useEffect(() => {
        if (!selectedProduct) {
            setCustomUnitPrice('');
            return;
        }

        if (activeVariant) {
            const wsPrice =
                typeof activeVariant.wholesalePrice === 'number' && activeVariant.wholesalePrice > 0
                    ? activeVariant.wholesalePrice
                    : typeof selectedProduct.wholesalePrice === 'number' && selectedProduct.wholesalePrice > 0
                    ? selectedProduct.wholesalePrice
                    : activeVariant.price || selectedProduct.price || 0;
            setCustomUnitPrice(String(wsPrice));
        } else {
            // Normal / Base product
            const baseWsPrice =
                typeof selectedProduct.wholesalePrice === 'number' && selectedProduct.wholesalePrice > 0
                    ? selectedProduct.wholesalePrice
                    : selectedProduct.price || 0;
            setCustomUnitPrice(String(baseWsPrice));
        }
    }, [selectedProduct, activeVariant]);

    // ── Helper computations ──
    const activeThumbnail = (activeVariant?.images && activeVariant.images[0]) || selectedProduct?.thumbnail || '';
    const activeSku = activeVariant?.sku || selectedProduct?.sku || 'N/A';
    const activeStock = activeVariant ? (activeVariant.stock ?? 0) : (selectedProduct?.stock ?? 0);
    const activeRetailPrice = activeVariant?.price ?? selectedProduct?.price ?? 0;
    const displayOriginalPrice = activeVariant?.originalPrice ?? selectedProduct?.originalPrice;

    const parsedUnitPrice = customUnitPrice.trim() !== '' ? Number(customUnitPrice) : (activeVariant?.wholesalePrice ?? selectedProduct?.wholesalePrice ?? activeRetailPrice);
    const finalUnitPrice = isNaN(parsedUnitPrice) ? 0 : Math.max(0, parsedUnitPrice);
    const parsedQty = parseInt(quantity, 10);
    const finalQty = isNaN(parsedQty) || parsedQty < 1 ? 1 : parsedQty;
    const lineTotal = finalQty * finalUnitPrice;

    const handlePickProduct = (prod: any) => {
        setSelectedProduct(prod);
        setSelectedSize('');
        setQuantity('10');
    };

    const handleSizeToggle = (size: string) => {
        if (selectedSize === size) {
            // Unselect back to Standard / Normal base product
            setSelectedSize('');
        } else {
            setSelectedSize(size);
        }
    };

    const handleAdd = () => {
        if (!selectedProduct) return;

        const variantLabel = activeVariant
            ? ([activeVariant.color, activeVariant.size].filter(Boolean).join(' / ') || activeVariant.label || activeVariant.size || 'Variant')
            : (selectedSize || 'Standard');

        onSelect({
            product: selectedProduct._id,
            name: selectedProduct.name,
            sku: activeSku !== 'N/A' ? activeSku : '',
            thumbnail: activeThumbnail,
            variantLabel: variantLabel === 'Standard' ? '' : variantLabel,
            quantity: finalQty,
            unitPrice: finalUnitPrice,
            retailPrice: activeRetailPrice,
        });

        // Reset & Close
        setSelectedProduct(null);
        setSelectedSize('');
        setQuantity('10');
        setCustomUnitPrice('');
        onClose();
    };

    // ── 2. CONDITIONAL RETURN MUST BE AFTER ALL HOOKS ──
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[92vh] md:h-[600px] max-h-[94vh] overflow-hidden border border-gray-200 flex flex-col animate-scaleUp">
                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 border-b border-emerald-900 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 sm:p-2 bg-white/10 rounded-lg">
                            <LuPackage size={18} className="text-emerald-200" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm sm:text-base text-white leading-tight">Add Product to Wholesale Order</h3>
                            <p className="text-[10px] sm:text-[11px] text-emerald-200/90">
                                Select product from catalogue, choose size, and set wholesale unit price
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                        title="Close modal"
                    >
                        <LuX size={18} />
                    </button>
                </div>

                {/* Search Bar & Catalogue Counter */}
                <div className="px-3 sm:px-5 py-2 sm:py-2.5 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 shrink-0">
                    <div className="relative w-full sm:max-w-md">
                        <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                        <input
                            type="text"
                            placeholder="Search by product name, SKU, tags..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-8 sm:pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs sm:text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all font-medium"
                            autoFocus
                        />
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className="text-[11px] sm:text-xs font-semibold text-gray-600 bg-gray-200/70 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full">
                            Catalogue: <strong className="text-emerald-800 font-bold">{products.length}</strong> products
                        </span>
                    </div>
                </div>

                {/* Content: Left List & Right Form - Fully Responsive (Flex column scrollable on mobile, 2-col grid on md+) */}
                <div className="flex-1 min-h-0 overflow-y-auto md:overflow-hidden flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 p-3 md:p-4">
                    {/* ════ LEFT COLUMN: Catalogue (5 of 12 cols) ════ */}
                    <div className="md:col-span-5 h-[190px] sm:h-[220px] md:h-full flex flex-col min-h-0 bg-white rounded-xl border border-gray-200 shadow-sm p-2.5 md:p-3 overflow-hidden shrink-0">
                        <div className="flex items-center justify-between mb-2 shrink-0 px-0.5">
                            <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                All Products ({products.length})
                            </span>
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="text-[10px] sm:text-[11px] text-emerald-700 hover:underline font-semibold"
                                >
                                    Clear search
                                </button>
                            )}
                        </div>

                        {/* Scrollable list filling the exact full height of the card */}
                        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2">
                            {isLoading ? (
                                <div className="text-center py-16 text-sm text-gray-400 flex flex-col items-center gap-2">
                                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                                    Loading catalogue products...
                                </div>
                            ) : products.length === 0 ? (
                                <div className="text-center py-16 text-xs text-gray-400 border-2 border-dashed border-gray-200 rounded-xl p-6">
                                    <LuPackage size={28} className="mx-auto mb-2 text-gray-300" />
                                    No products found matching &quot;{search}&quot;
                                </div>
                            ) : (
                                products.map((prod: any) => {
                                    const isSelected = selectedProduct?._id === prod._id;
                                    const hasWholesale = !!prod.wholesalePrice || prod.variants?.some((v: any) => !!v.wholesalePrice);
                                    const variantCount = prod.variants?.length || 0;
                                    const displayWsPrice = prod.wholesalePrice || (variantCount > 0 ? 'Var' : prod.price);

                                    return (
                                        <div
                                            key={prod._id}
                                            onClick={() => handlePickProduct(prod)}
                                            className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                                isSelected
                                                    ? 'border-emerald-600 bg-emerald-50/80 shadow-sm ring-1 ring-emerald-600'
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 bg-white'
                                            }`}
                                        >
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-100 relative">
                                                {prod.thumbnail ? (
                                                    <img
                                                        src={prod.thumbnail}
                                                        alt={prod.name}
                                                        className="w-full h-full object-contain p-0.5"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <LuPackage size={20} />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-xs font-bold text-gray-900 truncate leading-tight">
                                                    {prod.name}
                                                </h4>
                                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                    <span className="text-[11px] text-gray-500 font-medium">
                                                        ৳{prod.price}
                                                    </span>
                                                    {hasWholesale ? (
                                                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                                                            WS: ৳{displayWsPrice}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                                                            <LuTriangleAlert size={10} /> No WS Price
                                                        </span>
                                                    )}
                                                    {variantCount > 0 && (
                                                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                            <LuLayers size={10} /> {variantCount} Vars
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {isSelected && (
                                                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                                    <LuCheck size={14} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* ════ RIGHT COLUMN: Configuration Form (7 of 12 cols) ════ */}
                    <div className="md:col-span-7 flex flex-col min-h-0 bg-white rounded-xl border border-gray-200 shadow-sm p-3 md:p-3.5 overflow-visible md:overflow-hidden md:h-full shrink-0 md:shrink">
                        {selectedProduct ? (
                            <div className="flex flex-col h-full min-h-0 justify-between space-y-3 md:space-y-0">
                                {/* Top Controls Area: Scrollable when height/sizes are large, zero scrollbar if it fits */}
                                <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5 [scrollbar-width:thin]">
                                    {/* 1. Selected Product Summary Card */}
                                    <div className="bg-gray-50/90 p-2.5 rounded-xl border border-gray-200 flex items-start gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                                            {activeThumbnail ? (
                                                <img
                                                    src={activeThumbnail}
                                                    alt={selectedProduct.name}
                                                    className="w-full h-full object-contain p-0.5"
                                                />
                                            ) : (
                                                <LuPackage size={20} className="text-gray-300" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.2 rounded ${
                                                    activeVariant
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-emerald-100 text-emerald-800'
                                                }`}>
                                                    {activeVariant ? 'Variant Selected' : 'Standard / Normal Product'}
                                                </span>
                                            </div>
                                            <h4 className="text-xs sm:text-sm font-black text-gray-900 mt-0.5 line-clamp-1 leading-snug">
                                                {selectedProduct.name}
                                            </h4>
                                            <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-gray-500 font-medium">
                                                <span>SKU: <strong className="text-gray-700">{activeSku}</strong></span>
                                                <span>•</span>
                                                <span>
                                                    Stock: <strong className={activeStock <= 5 && activeStock > 0 ? 'text-amber-600 font-bold' : activeStock === 0 ? 'text-red-600 font-bold' : 'text-emerald-700 font-bold'}>
                                                        {activeStock}
                                                    </strong>
                                                </span>
                                                <span>•</span>
                                                <span>
                                                    Retail: {displayOriginalPrice && displayOriginalPrice > activeRetailPrice && (
                                                        <span className="line-through text-gray-400 mr-1">৳{displayOriginalPrice}</span>
                                                    )}
                                                    <strong className="text-gray-800 font-bold">৳{activeRetailPrice}</strong>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Size / Variant Selection Pills */}
                                    {sizeList.length > 0 && (
                                        <div className="bg-white p-2.5 rounded-xl border border-gray-200 space-y-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-gray-800">
                                                    Size / Variant Selection:
                                                </span>
                                                <span className="text-[11px] font-bold text-emerald-700">
                                                    {selectedSize ? `Selected: ${selectedSize}` : 'Standard / Normal (Base)'}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-1.5 max-h-[110px] overflow-y-auto pr-0.5 [scrollbar-width:thin]">
                                                {/* Standard / Normal Base Button */}
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedSize('')}
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                                                        !selectedSize
                                                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-600/20'
                                                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-emerald-600 hover:bg-emerald-50/40'
                                                    }`}
                                                >
                                                    {!selectedSize && <LuCheck size={11} />}
                                                    <span>Standard / Normal</span>
                                                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                                        !selectedSize ? 'bg-emerald-800 text-emerald-100' : 'bg-gray-200 text-gray-700'
                                                    }`}>
                                                        ৳{selectedProduct.wholesalePrice || selectedProduct.price}
                                                    </span>
                                                </button>

                                                {/* Size Variant Buttons */}
                                                {sizeList.map((size: string, idx: number) => {
                                                    const isSelected = selectedSize === size;
                                                    const matchingVar = selectedProduct.variants?.find(
                                                        (v: any) =>
                                                            v.size === size ||
                                                            v.label === size ||
                                                            [v.color, v.size].filter(Boolean).join(' / ') === size
                                                    );
                                                    const vWsPrice = matchingVar?.wholesalePrice || selectedProduct.wholesalePrice || matchingVar?.price || selectedProduct.price;

                                                    return (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => handleSizeToggle(size)}
                                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                                                                isSelected
                                                                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-600/20'
                                                                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-emerald-600 hover:bg-emerald-50/40'
                                                            }`}
                                                        >
                                                            {isSelected && <LuCheck size={11} />}
                                                            <span>{size}</span>
                                                            {vWsPrice && (
                                                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                                                    isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-gray-200 text-gray-700'
                                                                }`}>
                                                                    ৳{vWsPrice}
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* 3 & 4. Pricing & Quantity Side-by-Side (2 Columns - No Vertical Stacking & No Scrollbar) */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {/* Wholesale Unit Price Card */}
                                        <div className="bg-white p-2.5 rounded-xl border border-gray-200 space-y-1 shadow-2xs">
                                            <div className="flex justify-between items-center">
                                                <label className="block text-[11px] font-bold text-gray-800">
                                                    Wholesale Unit Price (৳) <span className="text-emerald-700">*</span>
                                                </label>
                                                <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-100">
                                                    Editable
                                                </span>
                                            </div>
                                            <div className="relative w-full">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">৳</span>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    placeholder="0"
                                                    value={customUnitPrice}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                            setCustomUnitPrice(val);
                                                        }
                                                    }}
                                                    className="w-full pl-6 pr-3 py-1 bg-emerald-50/40 border border-emerald-300 rounded-lg text-sm font-black text-emerald-900 outline-none focus:border-emerald-600 focus:bg-white transition-all shadow-inner"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] text-gray-500 pt-0.5">
                                                <span>Retail MRP: <strong className="text-gray-800">৳{activeRetailPrice}</strong></span>
                                                {activeRetailPrice > finalUnitPrice && (
                                                    <span className="text-emerald-700 font-bold">
                                                        ৳{activeRetailPrice - finalUnitPrice} off/unit
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Quantity Card */}
                                        <div className="bg-white p-2.5 rounded-xl border border-gray-200 space-y-1 shadow-2xs">
                                            <div className="flex justify-between items-center">
                                                <label className="block text-[11px] font-bold text-gray-800">
                                                    Quantity <span className="text-emerald-700">*</span>
                                                </label>
                                                <div className="flex items-center gap-1">
                                                    {[5, 10, 20, 50].map((q) => (
                                                        <button
                                                            key={q}
                                                            type="button"
                                                            onClick={() => setQuantity(String(q))}
                                                            className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition-colors ${
                                                                quantity === String(q)
                                                                    ? 'bg-emerald-700 text-white'
                                                                    : 'bg-gray-100 hover:bg-emerald-100 hover:text-emerald-800 text-gray-600'
                                                            }`}
                                                        >
                                                            {q}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 w-full">
                                                <button
                                                    type="button"
                                                    onClick={() => setQuantity(String(Math.max(1, (parseInt(quantity, 10) || 1) - 1)))}
                                                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 rounded-lg flex items-center justify-center font-bold transition-all shrink-0 border border-gray-200"
                                                >
                                                    <LuMinus size={12} />
                                                </button>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    placeholder="1"
                                                    value={quantity}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '');
                                                        setQuantity(val);
                                                    }}
                                                    className="flex-1 w-full min-w-0 h-8 bg-white border border-gray-200 rounded-lg text-sm font-black text-center text-gray-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setQuantity(String((parseInt(quantity, 10) || 0) + 1))}
                                                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 rounded-lg flex items-center justify-center font-bold transition-all shrink-0 border border-gray-200"
                                                >
                                                    <LuPlus size={12} />
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] text-gray-500 pt-0.5">
                                                <span>Available: <strong className={activeStock <= 5 && activeStock > 0 ? 'text-amber-600 font-bold' : activeStock === 0 ? 'text-red-600 font-bold' : 'text-emerald-700 font-bold'}>{activeStock}</strong> units</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Action Area: Line Total Banner + Action Button */}
                                <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-2.5 pb-2 border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] space-y-2 -mx-3 -mb-3 px-3 rounded-b-xl z-20 md:mx-0 md:mb-0 md:px-0 md:shadow-none md:static md:bg-transparent md:pt-2 md:border-t md:rounded-none">
                                    {/* 5. Wholesale Line Total Banner */}
                                    <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white px-3.5 py-2 rounded-xl flex items-center justify-between shadow-sm">
                                        <div>
                                            <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">
                                                Wholesale Line Total
                                            </span>
                                            <span className="text-xs text-emerald-200 font-medium">
                                                {finalQty} units × ৳{finalUnitPrice.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-lg font-black text-emerald-300">
                                                ৳ {lineTotal.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* 6. Action Button */}
                                    <button
                                        type="button"
                                        disabled={!selectedProduct || finalUnitPrice <= 0}
                                        onClick={handleAdd}
                                        className="w-full py-2.5 sm:py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white rounded-xl font-black text-sm shadow-md shadow-emerald-700/20 disabled:opacity-40 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <LuPlus size={16} />
                                        <span>Add to Wholesale Order</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="min-h-[180px] md:h-full flex flex-col items-center justify-center text-center text-gray-400 p-6 md:p-8">
                                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 mb-2.5 shadow-inner">
                                    <LuSparkles size={24} />
                                </div>
                                <h4 className="text-xs sm:text-sm font-bold text-gray-700 mb-1">Pick a product from the catalogue</h4>
                                <p className="text-[11px] sm:text-xs text-gray-400 max-w-xs">
                                    Click any product on the left catalogue to choose sizes, adjust quantity, and add to the wholesale order.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
