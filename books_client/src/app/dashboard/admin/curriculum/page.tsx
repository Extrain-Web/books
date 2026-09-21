/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    LuPlus, LuPencil, LuTrash2, LuChevronDown, LuChevronUp,
    LuGripVertical, LuEye, LuEyeOff, LuExternalLink, LuX,
    LuSave, LuBookOpen, LuArrowLeft, LuPalette,
} from 'react-icons/lu';
import {
    useGetCurriculumPagesQuery,
    useCreateCurriculumPageMutation,
    useUpdateCurriculumPageMutation,
    useDeleteCurriculumPageMutation,
} from '@/redux/api/curriculumPageApi';
import { useGetCategoriesQuery } from '@/redux/api/categoryApi';
import toast from 'react-hot-toast';
import Link from 'next/link';

/* ──────────────────────────────────────────────────────────────────────
   Admin Curriculum Pages — full CRUD for curriculum landing pages
   (A Level, O Level, etc.) with nested groups and category buttons.
   ────────────────────────────────────────────────────────────────────── */

/* ── Color presets ── */
const COLOR_PRESETS = [
    { name: 'Red', value: '#D32F2F' },
    { name: 'Deep Orange', value: '#E64A19' },
    { name: 'Orange', value: '#F08418' },
    { name: 'Green', value: '#2E7D32' },
    { name: 'Teal', value: '#00796B' },
    { name: 'Blue', value: '#1565C0' },
    { name: 'Indigo', value: '#283593' },
    { name: 'Purple', value: '#6A1B9A' },
    { name: 'Brown', value: '#4E342E' },
    { name: 'Grey', value: '#424242' },
];

/* ── Reusable color picker ── */
function ColorPicker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
    return (
        <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
            <div className="flex items-center gap-2 flex-wrap">
                {COLOR_PRESETS.map(c => (
                    <button
                        key={c.value}
                        type="button"
                        title={c.name}
                        onClick={() => onChange(c.value)}
                        className="w-7 h-7 rounded-full border-2 transition-all shrink-0"
                        style={{
                            background: c.value,
                            borderColor: value === c.value ? '#1e293b' : 'transparent',
                            transform: value === c.value ? 'scale(1.15)' : 'scale(1)',
                        }}
                    />
                ))}
                <div className="flex items-center gap-1 ml-1">
                    <input
                        type="color"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-7 h-7 rounded border border-gray-200 cursor-pointer p-0"
                        style={{ WebkitAppearance: 'none' }}
                    />
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-[72px] text-xs border border-gray-200 rounded px-1.5 py-1 font-mono"
                        placeholder="#000000"
                    />
                </div>
            </div>
        </div>
    );
}

/* ════════════════════════════════════════════════════════════════════ */

function MultiCategorySelect({ allCategories, selectedIds, onChange }: { allCategories: any[], selectedIds: string[], onChange: (ids: string[], slugs: string[]) => void }) {
    const [open, setOpen] = useState(false);
    
    const toggle = (cat: any) => {
        let newIds;
        if (selectedIds.includes(cat._id)) {
            newIds = selectedIds.filter(id => id !== cat._id);
        } else {
            newIds = [...selectedIds, cat._id];
        }
        
        const newSlugs = newIds.map(id => allCategories.find(c => c._id === id)?.slug).filter(Boolean);
        onChange(newIds, newSlugs);
    };

    return (
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <div 
                onClick={() => setOpen(!open)}
                style={{ 
                    padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, 
                    background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    minHeight: 30
                }}
            >
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedIds.length === 0 ? <span style={{ color: '#94a3b8' }}>— Select categories —</span> : `${selectedIds.length} categories selected`}
                </div>
                <LuChevronDown size={12} color="#94a3b8" />
            </div>
            
            {open && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setOpen(false)} />
                    <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        maxHeight: 250, overflowY: 'auto', zIndex: 100, padding: 8
                    }}>
                        {allCategories.map(cat => (
                            <label key={cat._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', cursor: 'pointer', borderRadius: 4, transition: 'background 0.1s' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                                <input type="checkbox" checked={selectedIds.includes(cat._id)} onChange={() => toggle(cat)} />
                                <span style={{ fontSize: 12, userSelect: 'none' }}>{cat.name} <span style={{ color: '#94a3b8' }}>({cat.slug})</span></span>
                            </label>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

/*  Main Page                                                          */
/* ════════════════════════════════════════════════════════════════════ */

export default function CurriculumAdminPage() {
    const { data, isLoading, refetch } = useGetCurriculumPagesQuery({});
    const pages = data?.data || [];
    const [createPage] = useCreateCurriculumPageMutation();
    const [deletePage] = useDeleteCurriculumPageMutation();

    const [editingPage, setEditingPage] = useState<any>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newSlug, setNewSlug] = useState('');
    const [newColor, setNewColor] = useState('#D32F2F');

    const handleCreate = async () => {
        if (!newTitle.trim()) { toast.error('Title is required'); return; }
        try {
            await createPage({
                title: newTitle.trim(),
                slug: newSlug.trim() || newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                bannerColor: newColor,
                groups: [],
            }).unwrap();
            toast.success('Curriculum page created!');
            setShowCreateModal(false);
            setNewTitle('');
            setNewSlug('');
            setNewColor('#D32F2F');
            refetch();
        } catch (err: any) {
            toast.error(err?.data?.message || 'Failed to create');
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
        try {
            await deletePage(id).unwrap();
            toast.success('Deleted');
            refetch();
        } catch (err: any) {
            toast.error(err?.data?.message || 'Failed to delete');
        }
    };

    if (editingPage) {
        return <PageEditor page={editingPage} onBack={() => { setEditingPage(null); refetch(); }} />;
    }

    return (
        <div style={{ padding: '20px 24px', maxWidth: 960 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        <LuBookOpen style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} size={22} />
                        Curriculum Pages
                    </h1>
                    <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                        Manage A Level, O Level and other curriculum landing pages
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '9px 18px', borderRadius: 8, border: 'none',
                        background: 'var(--color-primary)', color: '#fff',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}
                >
                    <LuPlus size={15} /> New Page
                </button>
            </div>

            {/* Loading */}
            {isLoading && (
                <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
                    Loading...
                </div>
            )}

            {/* Empty */}
            {!isLoading && pages.length === 0 && (
                <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
                    <LuBookOpen size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.5 }} />
                    <p style={{ fontSize: 14 }}>No curriculum pages yet</p>
                    <p style={{ fontSize: 12, marginTop: 4 }}>Create your first page to get started</p>
                </div>
            )}

            {/* Pages list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pages.map((page: any) => (
                    <div
                        key={page._id}
                        style={{
                            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
                            padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
                        }}
                    >
                        {/* Color swatch */}
                        <div
                            style={{
                                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                                background: `linear-gradient(135deg, ${page.bannerColor || '#D32F2F'}, ${page.bannerColor ? page.bannerColor + 'cc' : '#D32F2Fcc'})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: 800, fontSize: 16,
                            }}
                        >
                            {page.title?.[0] || '?'}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                                {page.title}
                                {!page.active && (
                                    <span style={{ fontSize: 10, fontWeight: 500, color: '#ef4444', marginLeft: 8, padding: '2px 6px', background: '#fef2f2', borderRadius: 4 }}>
                                        Inactive
                                    </span>
                                )}
                            </h3>
                            <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>
                                /curriculum/{page.slug} · {page.groups?.length || 0} groups
                            </p>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 6 }}>
                            <Link
                                href={`/curriculum/${page.slug}`}
                                target="_blank"
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    width: 34, height: 34, borderRadius: 8, border: '1px solid #e2e8f0',
                                    background: '#fff', color: '#64748b', cursor: 'pointer', textDecoration: 'none',
                                }}
                                title="Preview"
                            >
                                <LuExternalLink size={14} />
                            </Link>
                            <button
                                onClick={() => setEditingPage(page)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    width: 34, height: 34, borderRadius: 8, border: '1px solid #e2e8f0',
                                    background: '#fff', color: '#3b82f6', cursor: 'pointer',
                                }}
                                title="Edit"
                            >
                                <LuPencil size={14} />
                            </button>
                            <button
                                onClick={() => handleDelete(page._id, page.title)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    width: 34, height: 34, borderRadius: 8, border: '1px solid #fecaca',
                                    background: '#fff', color: '#ef4444', cursor: 'pointer',
                                }}
                                title="Delete"
                            >
                                <LuTrash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
                }}>
                    <div style={{
                        background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 440,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                Create Curriculum Page
                            </h2>
                            <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                <LuX size={18} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">Title *</label>
                                <input
                                    type="text"
                                    value={newTitle}
                                    onChange={(e) => {
                                        setNewTitle(e.target.value);
                                        if (!newSlug) setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                                    }}
                                    placeholder="e.g. A Level"
                                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 }}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">URL Slug</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                                    <span style={{ padding: '9px 10px', background: '#f8fafc', color: '#94a3b8', fontSize: 12, borderRight: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                                        /curriculum/
                                    </span>
                                    <input
                                        type="text"
                                        value={newSlug}
                                        onChange={(e) => setNewSlug(e.target.value)}
                                        placeholder="a-level"
                                        style={{ flex: 1, padding: '9px 12px', border: 'none', outline: 'none', fontSize: 14 }}
                                    />
                                </div>
                            </div>
                            <ColorPicker value={newColor} onChange={setNewColor} label="Banner Color" />
                        </div>

                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#64748b' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Page Editor — edit groups & buttons                                */
/* ════════════════════════════════════════════════════════════════════ */

function PageEditor({ page, onBack }: { page: any; onBack: () => void }) {
    const [updatePage, { isLoading: saving }] = useUpdateCurriculumPageMutation();
    const { data: categoriesData } = useGetCategoriesQuery({});
    const allCategories: any[] = categoriesData?.data || [];

    // Local editing state
    const [title, setTitle] = useState(page.title || '');
    const [slug, setSlug] = useState(page.slug || '');
    const [description, setDescription] = useState(page.description || '');
    const [bannerColor, setBannerColor] = useState(page.bannerColor || '#D32F2F');
    const [active, setActive] = useState(page.active !== false);
    const [groups, setGroups] = useState<any[]>(page.groups || []);
    const [expandedGroup, setExpandedGroup] = useState<number | null>(groups.length > 0 ? 0 : null);

    const save = useCallback(async () => {
        try {
            await updatePage({
                id: page._id,
                title,
                slug,
                description,
                bannerColor,
                active,
                groups: groups.map((g: any, gi: number) => ({
                    ...g,
                    order: gi,
                    buttons: (g.buttons || []).map((b: any, bi: number) => ({ ...b, order: bi })),
                })),
            }).unwrap();
            toast.success('Saved!');
        } catch (err: any) {
            toast.error(err?.data?.message || 'Failed to save');
        }
    }, [updatePage, page._id, title, slug, description, bannerColor, active, groups]);

    /* Group operations */
    const addGroup = () => {
        setGroups(prev => [...prev, { title: '', bgColor: bannerColor, active: true, buttons: [], order: prev.length }]);
        setExpandedGroup(groups.length);
    };
    const removeGroup = (idx: number) => {
        if (!confirm('Delete this group?')) return;
        setGroups(prev => prev.filter((_, i) => i !== idx));
    };
    const moveGroup = (idx: number, dir: -1 | 1) => {
        const newIdx = idx + dir;
        if (newIdx < 0 || newIdx >= groups.length) return;
        setGroups(prev => {
            const arr = [...prev];
            [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
            return arr;
        });
    };
    const updateGroup = (idx: number, field: string, value: any) => {
        setGroups(prev => prev.map((g, i) => i === idx ? { ...g, [field]: value } : g));
    };

    /* Button operations */
    const addButton = (gIdx: number) => {
        setGroups(prev => prev.map((g, i) => i === gIdx
            ? { ...g, buttons: [...(g.buttons || []), { label: '', categorySlug: '', categoryId: null, categorySlugs: [], categoryIds: [], customLink: '', active: true, order: (g.buttons || []).length }] }
            : g
        ));
    };
    const removeButton = (gIdx: number, bIdx: number) => {
        setGroups(prev => prev.map((g, i) => i === gIdx
            ? { ...g, buttons: (g.buttons || []).filter((_: any, bi: number) => bi !== bIdx) }
            : g
        ));
    };
    const updateButton = (gIdx: number, bIdx: number, field: string, value: any) => {
        setGroups(prev => prev.map((g, i) => i === gIdx
            ? { ...g, buttons: (g.buttons || []).map((b: any, bi: number) => bi === bIdx ? { ...b, [field]: value } : b) }
            : g
        ));
    };
    const moveButton = (gIdx: number, bIdx: number, dir: -1 | 1) => {
        const newIdx = bIdx + dir;
        setGroups(prev => prev.map((g, i) => {
            if (i !== gIdx) return g;
            const btns = [...(g.buttons || [])];
            if (newIdx < 0 || newIdx >= btns.length) return g;
            [btns[bIdx], btns[newIdx]] = [btns[newIdx], btns[bIdx]];
            return { ...g, buttons: btns };
        }));
    };

    const handleMultiCategorySelect = (gIdx: number, bIdx: number, ids: string[], slugs: string[]) => {
        setGroups(prev => prev.map((g, i) => i === gIdx
            ? {
                ...g,
                buttons: (g.buttons || []).map((b: any, bi: number) => bi === bIdx
                    ? { ...b, categoryIds: ids, categorySlugs: slugs, categoryId: ids[0] || null, categorySlug: slugs[0] || '' }
                    : b
                ),
            }
            : g
        ));
    };

    return (
        <div style={{ padding: '20px 24px', maxWidth: 960 }}>
            {/* Top bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <button
                    onClick={onBack}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 13, fontWeight: 500 }}
                >
                    <LuArrowLeft size={15} /> Back to list
                </button>
                <button
                    onClick={save}
                    disabled={saving}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '9px 20px', borderRadius: 8, border: 'none',
                        background: saving ? '#94a3b8' : 'var(--color-primary)', color: '#fff',
                        fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer',
                    }}
                >
                    <LuSave size={14} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Page details card */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 18 }}>
                    <LuPalette style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} size={16} />
                    Page Settings
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 }}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Slug</label>
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 }}
                        />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Description (optional)</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Short description shown under the title"
                            style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 }}
                        />
                    </div>
                    <div>
                        <ColorPicker value={bannerColor} onChange={setBannerColor} label="Banner Color" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                            <span style={{ fontWeight: 500, color: active ? '#0f172a' : '#94a3b8' }}>
                                {active ? 'Active' : 'Inactive'} — {active ? 'visible on website' : 'hidden from website'}
                            </span>
                        </label>
                    </div>
                </div>

                {/* Banner Preview */}
                <div style={{ marginTop: 20 }}>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Preview</label>
                    <div
                        style={{
                            background: `linear-gradient(135deg, ${bannerColor}, ${bannerColor}aa)`,
                            borderRadius: 10, padding: '24px 28px', color: '#fff',
                        }}
                    >
                        <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 6 }}>Home / {title}</div>
                        <h3 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{title || 'Page Title'}</h3>
                        {description && <p style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{description}</p>}
                    </div>
                </div>
            </div>

            {/* Groups section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Category Groups ({groups.length})
                </h2>
                <button
                    onClick={addGroup}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '7px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
                        background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#0f172a',
                    }}
                >
                    <LuPlus size={13} /> Add Group
                </button>
            </div>

            {groups.length === 0 && (
                <div style={{
                    border: '2px dashed #e2e8f0', borderRadius: 12, padding: 40, textAlign: 'center', color: '#94a3b8',
                }}>
                    <p style={{ fontSize: 13 }}>No groups yet. Click &quot;Add Group&quot; to create one.</p>
                    <p style={{ fontSize: 11, marginTop: 4 }}>Groups contain category buttons (like &quot;Edexcel A Level — IAL&quot;)</p>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {groups.map((group: any, gi: number) => (
                    <div
                        key={group._id || gi}
                        style={{
                            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden',
                        }}
                    >
                        {/* Group header */}
                        <div
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                                background: '#fafbfc', borderBottom: expandedGroup === gi ? '1px solid #e2e8f0' : 'none',
                                cursor: 'pointer',
                            }}
                            onClick={() => setExpandedGroup(expandedGroup === gi ? null : gi)}
                        >
                            <div
                                style={{ width: 8, height: 32, borderRadius: 4, flexShrink: 0, background: group.bgColor || bannerColor }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                                    {group.title || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Untitled Group</span>}
                                </h3>
                                <p style={{ fontSize: 11, color: '#94a3b8', margin: '1px 0 0' }}>
                                    {(group.buttons || []).length} buttons
                                    {!group.active && ' · Hidden'}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => moveGroup(gi, -1)} disabled={gi === 0} style={{ ...iconBtnStyle, opacity: gi === 0 ? 0.3 : 1 }} title="Move up"><LuChevronUp size={13} /></button>
                                <button onClick={() => moveGroup(gi, 1)} disabled={gi === groups.length - 1} style={{ ...iconBtnStyle, opacity: gi === groups.length - 1 ? 0.3 : 1 }} title="Move down"><LuChevronDown size={13} /></button>
                                <button onClick={() => updateGroup(gi, 'active', !group.active)} style={iconBtnStyle} title={group.active ? 'Hide' : 'Show'}>
                                    {group.active ? <LuEye size={13} /> : <LuEyeOff size={13} style={{ color: '#ef4444' }} />}
                                </button>
                                <button onClick={() => removeGroup(gi)} style={{ ...iconBtnStyle, color: '#ef4444' }} title="Delete"><LuTrash2 size={13} /></button>
                            </div>
                            {expandedGroup === gi ? <LuChevronUp size={16} color="#94a3b8" /> : <LuChevronDown size={16} color="#94a3b8" />}
                        </div>

                        {/* Group body (expanded) */}
                        {expandedGroup === gi && (
                            <div style={{ padding: 16 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Group Title</label>
                                        <input
                                            type="text"
                                            value={group.title}
                                            onChange={(e) => updateGroup(gi, 'title', e.target.value)}
                                            placeholder="e.g. Edexcel A Level — IAL"
                                            style={{ width: '100%', padding: '8px 11px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13 }}
                                        />
                                    </div>
                                    <ColorPicker value={group.bgColor || bannerColor} onChange={(v) => updateGroup(gi, 'bgColor', v)} label="Group Color" />
                                </div>

                                {/* Buttons */}
                                <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4 style={{ fontSize: 12, fontWeight: 600, color: '#64748b', margin: 0 }}>
                                        Buttons ({(group.buttons || []).length})
                                    </h4>
                                    <button
                                        onClick={() => addButton(gi)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 4,
                                            padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0',
                                            background: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', color: '#0f172a',
                                        }}
                                    >
                                        <LuPlus size={11} /> Add Button
                                    </button>
                                </div>

                                {(group.buttons || []).length === 0 && (
                                    <div style={{ border: '1px dashed #e2e8f0', borderRadius: 8, padding: 20, textAlign: 'center', color: '#c5cad0', fontSize: 12 }}>
                                        No buttons yet
                                    </div>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {(group.buttons || []).map((btn: any, bi: number) => (
                                        <div
                                            key={btn._id || bi}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 8,
                                                padding: '8px 10px', background: '#fafbfc', borderRadius: 8,
                                                border: '1px solid #f1f5f9',
                                            }}
                                        >
                                            <LuGripVertical size={12} color="#cbd5e1" />
                                            <input
                                                type="text"
                                                value={btn.label}
                                                onChange={(e) => updateButton(gi, bi, 'label', e.target.value)}
                                                placeholder="Button label"
                                                style={{ width: 150, padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12 }}
                                            />
                                            <MultiCategorySelect
                                                allCategories={allCategories}
                                                selectedIds={btn.categoryIds || (btn.categoryId ? [btn.categoryId] : [])}
                                                onChange={(ids, slugs) => handleMultiCategorySelect(gi, bi, ids, slugs)}
                                            />
                                            <div style={{ display: 'flex', gap: 3 }}>
                                                <button onClick={() => moveButton(gi, bi, -1)} disabled={bi === 0} style={{ ...iconBtnSmStyle, opacity: bi === 0 ? 0.3 : 1 }}><LuChevronUp size={11} /></button>
                                                <button onClick={() => moveButton(gi, bi, 1)} disabled={bi === (group.buttons || []).length - 1} style={{ ...iconBtnSmStyle, opacity: bi === (group.buttons || []).length - 1 ? 0.3 : 1 }}><LuChevronDown size={11} /></button>
                                                <button onClick={() => updateButton(gi, bi, 'active', !btn.active)} style={iconBtnSmStyle}>
                                                    {btn.active !== false ? <LuEye size={11} /> : <LuEyeOff size={11} style={{ color: '#ef4444' }} />}
                                                </button>
                                                <button onClick={() => removeButton(gi, bi)} style={{ ...iconBtnSmStyle, color: '#ef4444' }}><LuTrash2 size={11} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

const iconBtnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28, borderRadius: 6, border: '1px solid #e2e8f0',
    background: '#fff', cursor: 'pointer', color: '#64748b',
};

const iconBtnSmStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 24, height: 24, borderRadius: 5, border: '1px solid #e2e8f0',
    background: '#fff', cursor: 'pointer', color: '#64748b',
};
