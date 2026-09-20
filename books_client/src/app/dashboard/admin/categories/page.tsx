/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
    LuPlus, LuSquarePen, LuTrash2, LuSearch, LuX, LuSave, LuLayoutGrid,
} from 'react-icons/lu';
import {
    useGetCategoriesQuery,
    useDeleteCategoryMutation,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
} from '@/redux/api/categoryApi';
import { SingleImageUploader } from '@/components/ui/ImageUploader';
import { toast } from 'react-hot-toast';

/* ─── Styles ─── */
const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: '7px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: '#555', display: 'block', marginBottom: '5px' };
const errStyle: React.CSSProperties = { fontSize: '11px', color: '#ef4444', margin: '4px 0 0' };
/* parent may be a populated object {_id,name} or a raw id string or null */
const parentId = (cat: any): string => (cat?.parent && typeof cat.parent === 'object' ? cat.parent._id : cat?.parent) || '';
const parentName = (cat: any): string => (cat?.parent && typeof cat.parent === 'object' ? cat.parent.name : '') || '';

export const isImgUrl = (val?: string): boolean => {
    if (!val || typeof val !== 'string') return false;
    return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/') || val.startsWith('data:');
};

/* Category icons - variety marketplace product categories */
const ICON_OPTIONS = [
    { emoji: '📱', label: 'Electronics' },
    { emoji: '💻', label: 'Computers' },
    { emoji: '👗', label: 'Fashion' },
    { emoji: '👟', label: 'Footwear' },
    { emoji: '💄', label: 'Beauty' },
    { emoji: '🧴', label: 'Personal Care' },
    { emoji: '🏠', label: 'Home & Living' },
    { emoji: '🍳', label: 'Kitchen' },
    { emoji: '🪑', label: 'Furniture' },
    { emoji: '🔌', label: 'Appliances' },
    { emoji: '🛒', label: 'Grocery' },
    { emoji: '🧸', label: 'Toys & Baby' },
    { emoji: '📚', label: 'Books' },
    { emoji: '⚽', label: 'Sports' },
    { emoji: '🎮', label: 'Gaming' },
    { emoji: '⌚', label: 'Watches' },
    { emoji: '💍', label: 'Jewelry' },
    { emoji: '🎒', label: 'Bags' },
    { emoji: '💊', label: 'Health' },
    { emoji: '🚗', label: 'Automotive' },
    { emoji: '🐾', label: 'Pet Supplies' },
    { emoji: '🌿', label: 'Garden & Outdoor' },
];

const CategoriesPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const { data: categoriesData, isLoading } = useGetCategoriesQuery({});
    const [deleteCategory] = useDeleteCategoryMutation();
    const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
    const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();

    /* ─── Modal State ─── */
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [iconTab, setIconTab] = useState<'upload' | 'preset'>('upload');
    const [form, setForm] = useState({ name: '', icon: '', image: '', description: '', parent: '', isActive: true, showInMenu: true, showInHome: true });
    /* per-field inline errors (mirrors backend errorMessages[].path → message) */
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const categories = categoriesData?.data || [];
    const isSaving = isCreating || isUpdating;

    const openCreate = () => {
        setEditingId(null);
        setIconTab('upload');
        setForm({ name: '', icon: '', image: '', description: '', parent: '', isActive: true, showInMenu: true, showInHome: true });
        setFieldErrors({});
        setModalOpen(true);
    };

    const openEdit = (cat: any) => {
        setEditingId(cat._id);
        const hasImg = isImgUrl(cat.icon) || isImgUrl(cat.image);
        setIconTab(hasImg ? 'upload' : 'preset');
        setForm({
            name: cat.name || '',
            icon: cat.icon || cat.image || '',
            image: cat.image || (isImgUrl(cat.icon) ? cat.icon : ''),
            description: cat.description || '',
            parent: parentId(cat),
            isActive: cat.isActive !== false,
            showInMenu: cat.showInMenu !== false,
            showInHome: cat.showInHome !== false,
        });
        setFieldErrors({});
        setModalOpen(true);
    };

    const closeModal = () => { setModalOpen(false); setEditingId(null); setFieldErrors({}); };

    /* Client-side mirror of the backend zod rules → returns per-field error map */
    const validate = (): Record<string, string> => {
        const errs: Record<string, string> = {};
        if (!form.name.trim()) errs.name = 'Category name is required';
        if (!form.icon && !form.image) errs.icon = 'Please upload an image or select an icon';
        return errs;
    };

    const handleSave = async () => {
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setFieldErrors(errs);
            toast.error('Please fix the highlighted fields');
            return;
        }
        setFieldErrors({});

        const chosenIcon = form.icon || form.image || '';
        const isImg = isImgUrl(chosenIcon) || isImgUrl(form.image);

        // Build payload: parent as id or null
        const payload: any = {
            name: form.name.trim(),
            icon: chosenIcon,
            image: isImg ? (isImgUrl(chosenIcon) ? chosenIcon : form.image) : (form.image || ''),
            description: form.description,
            isActive: form.isActive,
            showInMenu: form.showInMenu,
            showInHome: form.showInHome,
            parent: form.parent || null,
        };

        try {
            if (editingId) {
                await updateCategory({ id: editingId, data: payload }).unwrap();
                toast.success('Category updated');
            } else {
                await createCategory(payload).unwrap();
                toast.success('Category created');
            }
            closeModal();
        } catch (error: any) {
            // Map backend 400 errorMessages[].path → matching field, render inline
            const errorMessages = error?.data?.errorMessages;
            if (Array.isArray(errorMessages) && errorMessages.length > 0) {
                const mapped: Record<string, string> = {};
                errorMessages.forEach((em: any) => { if (em?.path) mapped[em.path] = em.message; });
                setFieldErrors(mapped);
                toast.error(errorMessages[0]?.message || 'Please fix the highlighted fields');
            } else {
                toast.error(error?.data?.message || 'Something went wrong');
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await deleteCategory(id).unwrap();
                toast.success('Category deleted');
            } catch (error: any) {
                toast.error(error?.data?.message || 'Failed to delete');
            }
        }
    };

    const filtered = categories.filter((cat: any) =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Root categories available as parent options (exclude the category being edited)
    const rootCategories = categories.filter((c: any) => !parentId(c) && c._id !== editingId);

    // Order list so each parent is followed by its sub-categories (indented). Falls back to flat order when searching.
    const orderedList = (() => {
        if (searchTerm.trim()) return filtered.map((c: any) => ({ cat: c, isSub: !!parentId(c) }));
        const roots = filtered.filter((c: any) => !parentId(c));
        const subsByParent: Record<string, any[]> = {};
        filtered.forEach((c: any) => { const p = parentId(c); if (p) { (subsByParent[p] ||= []).push(c); } });
        const out: { cat: any; isSub: boolean }[] = [];
        roots.forEach((r: any) => {
            out.push({ cat: r, isSub: false });
            (subsByParent[r._id] || []).forEach((s: any) => out.push({ cat: s, isSub: true }));
        });
        // orphan sub-categories whose parent isn't in the current list
        filtered.forEach((c: any) => { const p = parentId(c); if (p && !roots.some((r: any) => r._id === p)) out.push({ cat: c, isSub: true }); });
        // de-dupe (orphans may already be appended)
        const seen = new Set<string>();
        return out.filter(({ cat }) => { if (seen.has(cat._id)) return false; seen.add(cat._id); return true; });
    })();

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#111', margin: 0 }}>Categories</h1>
                    <p style={{ fontSize: '12px', color: '#888', margin: '2px 0 0' }}>Manage product categories</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Link
                        href="/dashboard/admin/site-content?tab=categoryRows"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 14px', background: '#f8fafc', color: 'var(--color-primary)',
                            border: '1.5px solid var(--color-primary)', borderRadius: '7px', fontSize: '12.5px', fontWeight: 700,
                            textDecoration: 'none', cursor: 'pointer', transition: 'all 0.15s'
                        }}
                    >
                        <LuLayoutGrid size={14} /> Homepage Category Rows
                    </Link>
                    <button onClick={openCreate} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 16px', background: 'var(--color-primary)', color: '#fff',
                        border: 'none', borderRadius: '7px', fontSize: '12.5px', fontWeight: 700,
                        cursor: 'pointer',
                    }}>
                        <LuPlus size={14} /> Add Category
                    </button>
                </div>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '14px' }}>
                <LuSearch size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#bbb' }} />
                <input
                    type="text"
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ ...inp, paddingLeft: '34px' }}
                />
            </div>

            {/* Categories List */}
            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '10px', overflow: 'hidden' }}>
                {isLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <div style={{ width: '28px', height: '28px', border: '3px solid #e5e7eb', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
                    </div>
                ) : orderedList.length > 0 ? (
                    <div>
                        {orderedList.map(({ cat, isSub }: { cat: any; isSub: boolean }, i: number) => (
                            <div key={cat._id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '12px 16px',
                                paddingLeft: isSub ? '40px' : '16px',
                                background: isSub ? '#fcfcfc' : '#fff',
                                borderLeft: isSub ? '3px solid var(--color-primary-lightest)' : '3px solid transparent',
                                borderBottom: i < orderedList.length - 1 ? '1px solid #f5f5f5' : 'none',
                                transition: 'background 0.15s',
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                                onMouseLeave={e => e.currentTarget.style.background = isSub ? '#fcfcfc' : '#fff'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {isSub && <span style={{ color: '#ccc', fontSize: '14px', marginLeft: '-6px' }}>↳</span>}
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '8px',
                                        background: '#f5f5f5', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', flexShrink: 0, fontSize: '18px',
                                        overflow: 'hidden',
                                    }}>
                                        {isImgUrl(cat.icon) || isImgUrl(cat.image) ? (
                                            <img
                                                src={isImgUrl(cat.icon) ? cat.icon : cat.image}
                                                alt={cat.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            cat.icon || <LuLayoutGrid size={16} color="#bbb" />
                                        )}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#111', margin: 0, display: 'flex', alignItems: 'center', gap: '7px' }}>
                                            {cat.name}
                                            {isSub && (
                                                <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '999px', background: '#eef2ff', color: '#6366f1' }}>
                                                    Sub of {parentName(cat) || '—'}
                                                </span>
                                            )}
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '10.5px', color: '#aaa', fontFamily: 'monospace' }}>{cat.slug}</span>
                                            <span style={{
                                                fontSize: '9px', fontWeight: 700,
                                                padding: '1px 6px', borderRadius: '999px',
                                                background: cat.isActive ? 'var(--color-primary-lightest)' : '#fef2f2',
                                                color: cat.isActive ? '#16a34a' : '#dc2626',
                                            }}>
                                                {cat.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                            <span style={{ fontSize: '10px', color: '#ccc' }}>{cat.productCount || 0} products</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button onClick={() => openEdit(cat)} style={{
                                        width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'transparent', border: '1px solid transparent', borderRadius: '6px',
                                        cursor: 'pointer', color: 'var(--color-primary)', transition: 'all 0.15s',
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary-lightest)'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                                    >
                                        <LuSquarePen size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(cat._id)} style={{
                                        width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'transparent', border: '1px solid transparent', borderRadius: '6px',
                                        cursor: 'pointer', color: '#dc2626', transition: 'all 0.15s',
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                                    >
                                        <LuTrash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '50%',
                            background: 'var(--color-primary-lightest)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px',
                        }}>
                            <LuLayoutGrid size={24} style={{ color: 'var(--color-primary)' }} />
                        </div>

                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111', margin: '0 0 6px' }}>
                            No categories yet
                        </h3>
                        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 22px', maxWidth: '320px', lineHeight: 1.5 }}>
                            Categories help you organize products so customers can find them faster. Create your first one to get started.
                        </p>

                        <button onClick={openCreate} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '11px 24px', background: 'var(--color-primary)', color: '#fff',
                            border: 'none', borderRadius: '10px', fontSize: '13.5px', fontWeight: 700,
                            cursor: 'pointer', letterSpacing: '0.2px',
                            boxShadow: '0 6px 16px rgba(var(--color-primary-rgb),0.28)',
                            transition: 'transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease',
                        }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'var(--color-primary-dark)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 10px 22px rgba(var(--color-primary-rgb),0.36)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'var(--color-primary)';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(var(--color-primary-rgb),0.28)';
                            }}
                        >
                            <LuPlus size={16} strokeWidth={2.6} /> Create Category
                        </button>
                    </div>
                )}
            </div>

            {/* ═══ POPUP MODAL ═══ */}
            {modalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {/* Backdrop */}
                    <div onClick={closeModal} style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
                    }} />

                    {/* Modal */}
                    <div style={{
                        position: 'relative', background: '#fff',
                        borderRadius: '12px', width: '500px', maxWidth: '95vw',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                        animation: 'fadeIn 0.2s ease-out',
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '16px 20px', borderBottom: '1px solid #f0f0f0',
                        }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#111', margin: 0 }}>
                                {editingId ? 'Edit Category' : 'Add Category'}
                            </h3>
                            <button onClick={closeModal} style={{
                                width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: '#f5f5f5', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#888',
                            }}>
                                <LuX size={14} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '70vh', overflowY: 'auto' }}>
                            {/* Name */}
                            <div>
                                <label style={lbl}>Category Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <input
                                    type="text"
                                    placeholder="e.g. Electronics, Fashion"
                                    value={form.name}
                                    onChange={e => { setForm(p => ({ ...p, name: e.target.value })); if (fieldErrors.name) setFieldErrors(p => ({ ...p, name: '' })); }}
                                    style={{ ...inp, borderColor: fieldErrors.name ? '#fca5a5' : '#e5e7eb' }}
                                    autoFocus
                                />
                                {fieldErrors.name && <p style={errStyle}>{fieldErrors.name}</p>}
                            </div>

                            {/* Parent Category (make this a sub-category) */}
                            <div>
                                <label style={lbl}>
                                    Parent Category <span style={{ color: '#aaa', fontWeight: 400 }}>(optional — leave empty for a top-level category)</span>
                                </label>
                                <select
                                    value={form.parent}
                                    onChange={e => { setForm(p => ({ ...p, parent: e.target.value })); if (fieldErrors.parent) setFieldErrors(p => ({ ...p, parent: '' })); }}
                                    style={{ ...inp, borderColor: fieldErrors.parent ? '#fca5a5' : '#e5e7eb', background: '#fff', cursor: 'pointer' }}
                                >
                                    <option value="">— None (top-level category) —</option>
                                    {rootCategories.map((c: any) => (
                                        <option key={c._id} value={c._id}>{!isImgUrl(c.icon) && c.icon ? `${c.icon} ` : ''}{c.name}</option>
                                    ))}
                                </select>
                                {fieldErrors.parent && <p style={errStyle}>{fieldErrors.parent}</p>}
                            </div>

                            {/* Icon / Image Picker */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <label style={{ ...lbl, margin: 0 }}>
                                        Category Icon / Image <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '7px', padding: '2px', gap: '2px' }}>
                                        <button
                                            type="button"
                                            onClick={() => setIconTab('upload')}
                                            style={{
                                                padding: '4px 10px', fontSize: '11.5px', fontWeight: 600,
                                                borderRadius: '5px', border: 'none', cursor: 'pointer',
                                                background: iconTab === 'upload' ? '#fff' : 'transparent',
                                                color: iconTab === 'upload' ? 'var(--color-primary)' : '#666',
                                                boxShadow: iconTab === 'upload' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            🖼️ Upload Image
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIconTab('preset')}
                                            style={{
                                                padding: '4px 10px', fontSize: '11.5px', fontWeight: 600,
                                                borderRadius: '5px', border: 'none', cursor: 'pointer',
                                                background: iconTab === 'preset' ? '#fff' : 'transparent',
                                                color: iconTab === 'preset' ? 'var(--color-primary)' : '#666',
                                                boxShadow: iconTab === 'preset' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            ✨ Preset Emoji
                                        </button>
                                    </div>
                                </div>

                                {/* Preview Box */}
                                {form.icon && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        padding: '10px 14px', background: '#f8fffe',
                                        border: '1.5px solid var(--color-primary)',
                                        borderRadius: '8px', marginBottom: '10px',
                                    }}>
                                        {isImgUrl(form.icon) ? (
                                            <div style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', background: '#fff', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <img src={form.icon} alt="Category Icon" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '32px', lineHeight: 1 }}>{form.icon}</span>
                                        )}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#111' }}>
                                                {isImgUrl(form.icon) ? 'Custom Uploaded Image' : (ICON_OPTIONS.find(i => i.emoji === form.icon)?.label || 'Selected Emoji')}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>
                                                {isImgUrl(form.icon) ? 'Image icon active' : 'Emoji icon active'}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setForm(p => ({ ...p, icon: '', image: isImgUrl(p.image) ? '' : p.image }))}
                                            style={{
                                                marginLeft: 'auto', background: 'none', border: 'none',
                                                cursor: 'pointer', color: '#aaa', fontSize: '18px', lineHeight: 1,
                                            }}
                                            title="Clear selection"
                                        >×</button>
                                    </div>
                                )}

                                {iconTab === 'upload' ? (
                                    <div style={{ background: '#fafafa', padding: '12px', borderRadius: '8px', border: `1.5px solid ${fieldErrors.icon ? '#fca5a5' : '#e5e7eb'}` }}>
                                        <SingleImageUploader
                                            label="Upload Category Icon / Image"
                                            value={isImgUrl(form.icon) ? form.icon : (form.image || '')}
                                            onChange={(url) => {
                                                setForm(p => ({ ...p, icon: url, image: url }));
                                                if (fieldErrors.icon) setFieldErrors(p => ({ ...p, icon: '' }));
                                            }}
                                        />
                                    </div>
                                ) : (
                                    /* Icon Grid */
                                    <div style={{
                                        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px',
                                        padding: '12px', background: '#fafafa',
                                        border: `1.5px solid ${fieldErrors.icon ? '#fca5a5' : '#e5e7eb'}`,
                                        borderRadius: '8px', maxHeight: '180px', overflowY: 'auto',
                                    }}>
                                        {ICON_OPTIONS.map((opt) => (
                                            <button
                                                type="button"
                                                key={opt.emoji}
                                                title={opt.label}
                                                onClick={() => { setForm(p => ({ ...p, icon: opt.emoji })); if (fieldErrors.icon) setFieldErrors(p => ({ ...p, icon: '' })); }}
                                                style={{
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                    justifyContent: 'center', gap: '3px',
                                                    padding: '8px 4px', borderRadius: '8px', cursor: 'pointer',
                                                    border: form.icon === opt.emoji
                                                        ? '2px solid var(--color-primary)'
                                                        : '2px solid transparent',
                                                    background: form.icon === opt.emoji
                                                        ? 'var(--color-primary-lightest, #f0fdf4)'
                                                        : '#fff',
                                                    transition: 'all 0.15s',
                                                    boxShadow: form.icon === opt.emoji
                                                        ? '0 0 0 1px var(--color-primary)'
                                                        : '0 1px 3px rgba(0,0,0,0.06)',
                                                }}
                                                onMouseEnter={e => {
                                                    if (form.icon !== opt.emoji)
                                                        (e.currentTarget as HTMLElement).style.background = '#f3f4f6';
                                                }}
                                                onMouseLeave={e => {
                                                    if (form.icon !== opt.emoji)
                                                        (e.currentTarget as HTMLElement).style.background = '#fff';
                                                }}
                                            >
                                                <span style={{ fontSize: '22px', lineHeight: 1 }}>{opt.emoji}</span>
                                                <span style={{ fontSize: '9px', color: '#888', fontWeight: 500, textAlign: 'center', lineHeight: 1.2 }}>
                                                    {opt.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {fieldErrors.icon && (
                                    <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', margin: '4px 0 0' }}>
                                        ⚠ {fieldErrors.icon}
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label style={lbl}>Description <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span></label>
                                <textarea
                                    placeholder="Short description..."
                                    rows={2}
                                    value={form.description}
                                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                    style={{ ...inp, resize: 'vertical' }}
                                />
                            </div>

                            {/* Toggles */}
                            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {[
                                    { key: 'isActive', label: 'Active' },
                                    { key: 'showInMenu', label: 'Show in Menu' },
                                    { key: 'showInHome', label: 'Show on Homepage' },
                                ].map((toggle) => (
                                    <label key={toggle.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                                        <span style={{ fontSize: '12.5px', color: '#555', fontWeight: 500 }}>{toggle.label}</span>
                                        <div
                                            onClick={() => setForm(p => ({ ...p, [toggle.key]: !(p as any)[toggle.key] }))}
                                            style={{
                                                position: 'relative', width: '36px', height: '20px',
                                                borderRadius: '999px', cursor: 'pointer',
                                                background: (form as any)[toggle.key] ? 'var(--color-primary)' : '#ddd',
                                                transition: 'background 0.2s',
                                            }}
                                        >
                                            <div style={{
                                                position: 'absolute', top: '3px',
                                                left: (form as any)[toggle.key] ? '19px' : '3px',
                                                width: '14px', height: '14px', borderRadius: '50%',
                                                background: '#fff', transition: 'left 0.2s',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                                            }} />
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            display: 'flex', gap: '8px', padding: '14px 20px',
                            borderTop: '1px solid #f0f0f0',
                        }}>
                            <button onClick={closeModal} style={{
                                flex: 1, padding: '9px', background: '#f5f5f5', color: '#666',
                                border: 'none', borderRadius: '7px', fontSize: '12.5px', fontWeight: 600,
                                cursor: 'pointer',
                            }}>
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={isSaving} style={{
                                flex: 1, padding: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                background: isSaving ? '#888' : 'var(--color-primary)', color: '#fff',
                                border: 'none', borderRadius: '7px', fontSize: '12.5px', fontWeight: 700,
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                            }}>
                                <LuSave size={13} />
                                {isSaving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoriesPage;
