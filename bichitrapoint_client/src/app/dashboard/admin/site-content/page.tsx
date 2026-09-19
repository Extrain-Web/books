/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useGetSiteContentQuery, useUpdateSiteContentMutation, useGetAllLegalPagesQuery, useUpdateLegalPageMutation } from '@/redux/api/siteContentApi';
import { useGetCategoriesQuery } from '@/redux/api/categoryApi';
import { toast } from 'react-hot-toast';
import dynamic from 'next/dynamic';
import {
    LuPhone, LuMessageCircle, LuLayoutDashboard, LuFileText, LuImage,
    LuSave, LuPlus, LuTrash2, LuCircleCheck, LuArrowUp, LuArrowDown, LuCreditCard,
    LuLayoutGrid,
} from 'react-icons/lu';
import { SingleImageUploader, MultipleImageUploader } from '@/components/ui/ImageUploader';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false, loading: () => <div style={{ height: '350px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} /> });
import 'react-quill-new/dist/quill.snow.css';

/* ─── Styles ─── */
const card: React.CSSProperties = { background: '#fff', border: '1px solid #eee', borderRadius: '10px', padding: '20px', marginBottom: '16px' };
const label: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: '#555', display: 'block', marginBottom: '5px' };
const input: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '1.5px solid #e5e7eb', borderRadius: '7px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const };
const btn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', borderRadius: '7px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s' };
const btnPrimary: React.CSSProperties = { ...btn, background: 'var(--color-primary)', color: '#fff' };
const btnDanger: React.CSSProperties = { ...btn, background: '#fef2f2', color: '#dc2626', padding: '6px 10px' };
const btnSmall: React.CSSProperties = { ...btn, background: '#f3f4f6', color: '#333', padding: '6px 12px', fontSize: '12px' };

/* ─── Tabs Config ─── */
const TABS = [
    { key: 'hero', label: '🖼️ Hero Slides', icon: LuImage },
    { key: 'categoryRows', label: '📚 Category Rows', icon: LuLayoutGrid },
    { key: 'contact', label: 'Contact Page', icon: LuPhone },
    { key: 'payment', label: 'Payment Numbers', icon: LuCreditCard },
    { key: 'floating', label: 'Floating Widget', icon: LuMessageCircle },
    { key: 'footer', label: 'Footer', icon: LuLayoutDashboard },
    { key: 'legal', label: 'Legal Pages', icon: LuFileText },
];

export default function SiteContentPage() {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');
    const { data: res, isLoading } = useGetSiteContentQuery({});
    const [updateContent, { isLoading: isSaving }] = useUpdateSiteContentMutation();
    const [activeTab, setActiveTab] = useState(tabParam || 'categoryRows');
    const [formData, setFormData] = useState<any>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (tabParam && TABS.some(t => t.key === tabParam)) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    useEffect(() => {
        if (res?.data) {
            setFormData(JSON.parse(JSON.stringify(res.data)));
        }
    }, [res]);

    const handleSave = async () => {
        if (activeTab === 'legal') return; // Legal pages have their own save
        try {
            const payload: any = {};
            if (activeTab === 'hero') {
                // The Hero tab owns both the carousel slides and the mid-page promo banner.
                payload.heroSlides = formData.heroSlides;
                payload.homeBanner = formData.homeBanner;
            } else if (activeTab === 'categoryRows') {
                payload.categoryRows = formData.categoryRows;
            } else {
                payload[activeTab] = formData[activeTab];
            }
            await updateContent(payload).unwrap();
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
            toast.success('Saved successfully!');
        } catch {
            toast.error('Failed to save');
        }
    };

    if (isLoading || !formData) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#111', margin: 0 }}>Site Content</h1>
                    <p style={{ fontSize: '12px', color: '#888', margin: '2px 0 0' }}>Manage dynamic content across your website</p>
                </div>
                <button onClick={handleSave} disabled={isSaving} style={{ ...btnPrimary, opacity: isSaving ? 0.6 : 1 }}>
                    {saveSuccess ? <><LuCircleCheck size={14} /> Saved!</> : <><LuSave size={14} /> {isSaving ? 'Saving...' : 'Save Changes'}</>}
                </button>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', flexWrap: 'wrap', borderBottom: '1px solid #eee', paddingBottom: '1px' }}>
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 14px', border: 'none', cursor: 'pointer',
                            fontSize: '12.5px', fontWeight: activeTab === tab.key ? 700 : 500,
                            color: activeTab === tab.key ? 'var(--color-primary)' : '#888',
                            background: activeTab === tab.key ? 'var(--color-primary-lightest)' : 'transparent',
                            borderRadius: '6px 6px 0 0',
                            borderBottom: activeTab === tab.key ? '2px solid var(--color-primary)' : '2px solid transparent',
                            transition: 'all 0.15s',
                        }}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'categoryRows' && <CategoryRowsTab data={formData} setData={setFormData} onSave={handleSave} isSaving={isSaving} />}
            {activeTab === 'hero' && <HeroSlidesTab data={formData} setData={setFormData} onSave={handleSave} isSaving={isSaving} />}
            {activeTab === 'contact' && <ContactTab data={formData} setData={setFormData} />}
            {activeTab === 'payment' && <PaymentTab data={formData} setData={setFormData} />}
            {activeTab === 'floating' && <FloatingTab data={formData} setData={setFormData} />}
            {activeTab === 'footer' && <FooterTab data={formData} setData={setFormData} />}
            {activeTab === 'legal' && <LegalPagesTab />}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* ─── CONTACT TAB ─── */
function ContactTab({ data, setData }: { data: any; setData: any }) {
    const c = data.contact || {};

    const updateField = (field: string, value: any) => {
        setData((p: any) => ({ ...p, contact: { ...p.contact, [field]: value } }));
    };

    const addPhone = () => updateField('phones', [...(c.phones || []), '']);
    const removePhone = (idx: number) => updateField('phones', (c.phones || []).filter((_: any, i: number) => i !== idx));
    const updatePhone = (idx: number, val: string) => {
        const arr = [...(c.phones || [])]; arr[idx] = val;
        updateField('phones', arr);
    };

    const addEmail = () => updateField('emails', [...(c.emails || []), '']);
    const removeEmail = (idx: number) => updateField('emails', (c.emails || []).filter((_: any, i: number) => i !== idx));
    const updateEmail = (idx: number, val: string) => {
        const arr = [...(c.emails || [])]; arr[idx] = val;
        updateField('emails', arr);
    };

    const addHour = () => {
        setData((p: any) => ({ ...p, contact: { ...p.contact, hours: [...(p.contact.hours || []), { day: '', time: '' }] } }));
    };
    const removeHour = (idx: number) => {
        setData((p: any) => ({ ...p, contact: { ...p.contact, hours: p.contact.hours.filter((_: any, i: number) => i !== idx) } }));
    };
    const updateHour = (idx: number, field: string, value: string) => {
        setData((p: any) => {
            const h = [...p.contact.hours]; h[idx] = { ...h[idx], [field]: value };
            return { ...p, contact: { ...p.contact, hours: h } };
        });
    };

    const addTip = () => updateField('tips', [...(c.tips || []), '']);
    const removeTip = (idx: number) => updateField('tips', c.tips.filter((_: any, i: number) => i !== idx));
    const updateTip = (idx: number, value: string) => {
        const tips = [...c.tips]; tips[idx] = value;
        updateField('tips', tips);
    };

    const addSubject = () => updateField('subjects', [...(c.subjects || []), '']);
    const removeSubject = (idx: number) => updateField('subjects', c.subjects.filter((_: any, i: number) => i !== idx));
    const updateSubject = (idx: number, value: string) => {
        const subs = [...c.subjects]; subs[idx] = value;
        updateField('subjects', subs);
    };

    const addSocial = (label = '', url = '', color = '#0072BC') => {
        updateField('socials', [...(c.socials || []), { label, url, color }]);
    };
    const removeSocial = (idx: number) => {
        updateField('socials', (c.socials || []).filter((_: any, i: number) => i !== idx));
    };
    const updateSocial = (idx: number, field: string, value: string) => {
        const s = [...(c.socials || [])]; s[idx] = { ...s[idx], [field]: value };
        updateField('socials', s);
    };

    const loadDefaultSocials = () => {
        const defaults = [
            { label: 'Facebook', url: 'https://www.facebook.com/BichitraPoints', color: '#3b5998' },
            { label: 'WhatsApp', url: c.whatsapp ? `https://wa.me/${c.whatsapp.replace(/\D/g, '')}` : 'https://wa.me/8801739498553', color: '#25D366' },
            { label: 'Instagram', url: 'https://www.instagram.com', color: '#E1306C' },
            { label: 'YouTube', url: 'https://www.youtube.com', color: '#FF0000' },
            { label: 'LinkedIn', url: 'https://www.linkedin.com', color: '#0077B5' },
        ];
        updateField('socials', defaults);
    };

    return (
        <div>
            {/* Status Badge */}
            <div style={{ ...card, background: 'var(--color-primary-lightest)', borderColor: '#bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LuCircleCheck size={16} color="#16a34a" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a' }}>Active — This data is used on the <strong>Contact Us</strong> page, Footer, and Header.</span>
                </div>
            </div>

            {/* Basic Info */}
            <div style={card}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 14px' }}>Primary Contact Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div><label style={label}>Primary Phone Number</label><input value={c.phone || ''} onChange={e => updateField('phone', e.target.value)} placeholder="01XXXXXXXXX" style={input} /></div>
                    <div><label style={label}>WhatsApp Number</label><input value={c.whatsapp || ''} onChange={e => updateField('whatsapp', e.target.value)} placeholder="01XXXXXXXXX" style={input} /></div>
                    <div><label style={label}>Primary Email</label><input value={c.email || ''} onChange={e => updateField('email', e.target.value)} placeholder="support@bichitrapoint.com" style={input} /></div>
                    <div><label style={label}>Official Website URL</label><input value={c.website || ''} onChange={e => updateField('website', e.target.value)} placeholder="https://bichitrapoint.com" style={input} /></div>
                    <div><label style={label}>Corporate / Head Office Address</label><input value={c.corporateOffice || ''} onChange={e => updateField('corporateOffice', e.target.value)} placeholder="Alor Dishari, 6/6, Shantibagh..." style={input} /></div>
                    <div><label style={label}>Warehouse Address</label><input value={c.warehouse || ''} onChange={e => updateField('warehouse', e.target.value)} placeholder="Warehouse address (optional)..." style={input} /></div>
                    <div style={{ gridColumn: '1 / -1' }}><label style={label}>General / Store Address</label><input value={c.address || ''} onChange={e => updateField('address', e.target.value)} placeholder="6 Kalabagan, Bus Stand, Dhaka-1205" style={input} /></div>
                </div>
            </div>

            {/* Additional Contact Numbers & Emails */}
            <div style={card}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 14px' }}>Additional Phone Numbers & Emails</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* Phones list */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label style={{ ...label, margin: 0 }}>Extra Phone Numbers</label>
                            <button type="button" onClick={addPhone} style={btnSmall}><LuPlus size={13} /> Add Phone</button>
                        </div>
                        {(c.phones || []).map((ph: string, idx: number) => (
                            <div key={idx} style={{ display: 'flex', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                                <input value={ph} onChange={e => updatePhone(idx, e.target.value)} placeholder="Extra phone number..." style={{ ...input, flex: 1 }} />
                                <button type="button" onClick={() => removePhone(idx)} style={btnDanger}><LuTrash2 size={13} /></button>
                            </div>
                        ))}
                        {(c.phones || []).length === 0 && <p style={{ fontSize: '11px', color: '#999', margin: '4px 0' }}>No extra phone numbers added.</p>}
                    </div>

                    {/* Emails list */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label style={{ ...label, margin: 0 }}>Extra Email Addresses</label>
                            <button type="button" onClick={addEmail} style={btnSmall}><LuPlus size={13} /> Add Email</button>
                        </div>
                        {(c.emails || []).map((em: string, idx: number) => (
                            <div key={idx} style={{ display: 'flex', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                                <input value={em} onChange={e => updateEmail(idx, e.target.value)} placeholder="Extra email address..." style={{ ...input, flex: 1 }} />
                                <button type="button" onClick={() => removeEmail(idx)} style={btnDanger}><LuTrash2 size={13} /></button>
                            </div>
                        ))}
                        {(c.emails || []).length === 0 && <p style={{ fontSize: '11px', color: '#999', margin: '4px 0' }}>No extra email addresses added.</p>}
                    </div>
                </div>
            </div>

            {/* Social Media Links */}
            <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 2px' }}>Social Media Links</h3>
                        <p style={{ fontSize: '11px', color: '#888', margin: 0 }}>These links appear in the website Footer and Contact page.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {(!c.socials || c.socials.length === 0) && (
                            <button type="button" onClick={loadDefaultSocials} style={{ ...btnSmall, background: '#eff6ff', color: '#1d4ed8' }}>
                                Pre-fill Standard Socials
                            </button>
                        )}
                        <button type="button" onClick={() => addSocial()} style={btnSmall}><LuPlus size={13} /> Add Social Link</button>
                    </div>
                </div>
                {(c.socials || []).map((s: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input value={s.label || ''} onChange={e => updateSocial(idx, 'label', e.target.value)} placeholder="Platform (e.g. Facebook)" style={{ ...input, width: '130px' }} />
                        <input value={s.url || ''} onChange={e => updateSocial(idx, 'url', e.target.value)} placeholder="Profile / Page URL" style={{ ...input, flex: 1, minWidth: '200px' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input type="color" value={s.color || '#0072BC'} onChange={e => updateSocial(idx, 'color', e.target.value)} style={{ width: '36px', height: '32px', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', padding: '2px' }} title="Brand color" />
                            <button type="button" onClick={() => removeSocial(idx)} style={btnDanger} title="Delete"><LuTrash2 size={13} /></button>
                        </div>
                    </div>
                ))}
                {(c.socials || []).length === 0 && <p style={{ fontSize: '12px', color: '#bbb', textAlign: 'center', padding: '12px' }}>No social media links configured yet. Click &ldquo;Pre-fill Standard Socials&rdquo; to add defaults.</p>}
            </div>

            {/* Business Hours */}
            <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Business Hours</h3>
                    <button onClick={addHour} style={btnSmall}><LuPlus size={13} /> Add</button>
                </div>
                {(c.hours || []).map((h: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                        <input value={h.day} onChange={e => updateHour(idx, 'day', e.target.value)} placeholder="Day (e.g. Sunday – Thursday)" style={{ ...input, flex: 1 }} />
                        <input value={h.time} onChange={e => updateHour(idx, 'time', e.target.value)} placeholder="Time (e.g. 9 AM – 6 PM)" style={{ ...input, flex: 1 }} />
                        <button onClick={() => removeHour(idx)} style={btnDanger}><LuTrash2 size={13} /></button>
                    </div>
                ))}
                {(c.hours || []).length === 0 && <p style={{ fontSize: '12px', color: '#bbb', textAlign: 'center', padding: '12px' }}>No hours added yet.</p>}
            </div>

            {/* Subjects */}
            <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Form Subjects</h3>
                    <button onClick={addSubject} style={btnSmall}><LuPlus size={13} /> Add</button>
                </div>
                {(c.subjects || []).map((s: string, idx: number) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                        <input value={s} onChange={e => updateSubject(idx, e.target.value)} placeholder="Subject option..." style={{ ...input, flex: 1 }} />
                        <button onClick={() => removeSubject(idx)} style={btnDanger}><LuTrash2 size={13} /></button>
                    </div>
                ))}
                {(c.subjects || []).length === 0 && <p style={{ fontSize: '12px', color: '#bbb', textAlign: 'center', padding: '12px' }}>No subjects added yet.</p>}
            </div>

            {/* Tips */}
            <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Quick Tips</h3>
                    <button onClick={addTip} style={btnSmall}><LuPlus size={13} /> Add</button>
                </div>
                {(c.tips || []).map((t: string, idx: number) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                        <input value={t} onChange={e => updateTip(idx, e.target.value)} placeholder="Tip text..." style={{ ...input, flex: 1 }} />
                        <button onClick={() => removeTip(idx)} style={btnDanger}><LuTrash2 size={13} /></button>
                    </div>
                ))}
                {(c.tips || []).length === 0 && <p style={{ fontSize: '12px', color: '#bbb', textAlign: 'center', padding: '12px' }}>No tips added yet.</p>}
            </div>
        </div>
    );
}

/* ─── FLOATING TAB ─── */
function FloatingTab({ data, setData }: { data: any; setData: any }) {
    const f = data.floating || {};
    const update = (field: string, value: any) => setData((p: any) => ({ ...p, floating: { ...p.floating, [field]: value } }));

    return (
        <div style={card}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 6px' }}>Floating Contact Widget</h3>
            <p style={{ fontSize: '12px', color: '#888', margin: '0 0 16px' }}>Manage the floating WhatsApp/Messenger/Phone button that appears on every page.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                    <label style={label}>Phone Number</label>
                    <input value={f.phone || ''} onChange={e => update('phone', e.target.value)} style={input} />
                </div>
                <div>
                    <label style={label}>Show Phone</label>
                    <select value={f.showPhone ? 'true' : 'false'} onChange={e => update('showPhone', e.target.value === 'true')} style={input}>
                        <option value="true">Yes</option><option value="false">No</option>
                    </select>
                </div>
                <div>
                    <label style={label}>WhatsApp Number (with country code)</label>
                    <input value={f.whatsapp || ''} onChange={e => update('whatsapp', e.target.value)} placeholder="8801XXXXXXXXX" style={input} />
                </div>
                <div>
                    <label style={label}>Show WhatsApp</label>
                    <select value={f.showWhatsapp ? 'true' : 'false'} onChange={e => update('showWhatsapp', e.target.value === 'true')} style={input}>
                        <option value="true">Yes</option><option value="false">No</option>
                    </select>
                </div>
                <div>
                    <label style={label}>Messenger Page Username</label>
                    <input value={f.messenger || ''} onChange={e => update('messenger', e.target.value)} placeholder="YOUR_PAGE_USERNAME" style={input} />
                </div>
                <div>
                    <label style={label}>Show Messenger</label>
                    <select value={f.showMessenger ? 'true' : 'false'} onChange={e => update('showMessenger', e.target.value === 'true')} style={input}>
                        <option value="true">Yes</option><option value="false">No</option>
                    </select>
                </div>
            </div>
        </div>
    );
}

/* ─── PAYMENT TAB ─── */
function PaymentTab({ data, setData }: { data: any; setData: any }) {
    const methods = [
        { key: 'bkash', label: 'bKash', color: '#E2136E', desc: 'bKash mobile wallet' },
        { key: 'nagad', label: 'Nagad', color: '#F47920', desc: 'Nagad digital financial service' },
        { key: 'rocket', label: 'Rocket (DBBL)', color: '#8332AC', desc: 'Dutch-Bangla Bank Rocket mobile wallet' },
        { key: 'sslcommerz', label: 'Cards & Mobile Banking (SSLCommerz)', color: '#1F6FEB', desc: 'Visa, Mastercard, Amex & multi-gateway payments' },
        { key: 'cod', label: 'Cash on Delivery', color: '#16a34a', desc: 'Pay in cash upon physical delivery' },
    ];

    const p = data.payment || {};
    const updateMethod = (method: string, field: string, value: any) => {
        setData((prev: any) => ({
            ...prev,
            payment: {
                ...prev.payment,
                [method]: { ...(prev.payment?.[method] || {}), [field]: value },
            },
        }));
    };
    const updateInstructions = (value: string) => {
        setData((prev: any) => ({ ...prev, payment: { ...prev.payment, instructions: value } }));
    };

    return (
        <div>
            {/* Info */}
            <div style={{ ...card, background: 'var(--color-primary-lightest)', borderColor: '#bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LuCircleCheck size={16} color="#16a34a" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a' }}>
                        These payment options are controlled here for the <strong>Checkout</strong> page. You can enable/disable any method, set wallet numbers, and customize instructions.
                    </span>
                </div>
            </div>

            {/* Method cards */}
            {methods.map(m => {
                const md = p[m.key] || {};
                const isCOD = m.key === 'cod';
                const isGatewayOnly = m.key === 'sslcommerz';
                return (
                    <div key={m.key} style={{ ...card, borderLeft: `4px solid ${m.color}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: (isCOD || isGatewayOnly) ? 0 : '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: m.color }} />
                                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: m.color }}>{m.label}</h3>
                                {isCOD && <span style={{ fontSize: '11px', color: '#888', fontWeight: 400 }}>— no phone number needed</span>}
                                {isGatewayOnly && <span style={{ fontSize: '11px', color: '#888', fontWeight: 400 }}>— online gateway</span>}
                            </div>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: md.active !== false ? '#16a34a' : '#9ca3af', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={md.active !== false}
                                    onChange={e => updateMethod(m.key, 'active', e.target.checked)}
                                    style={{ width: '16px', height: '16px', accentColor: m.color, cursor: 'pointer' }}
                                />
                                {md.active !== false ? 'Enabled' : 'Disabled'}
                            </label>
                        </div>
                        {!isCOD && !isGatewayOnly && (
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={label}>{m.label} Number</label>
                                    <input
                                        value={md.number || ''}
                                        onChange={e => updateMethod(m.key, 'number', e.target.value)}
                                        placeholder="01XXXXXXXXX"
                                        style={input}
                                    />
                                </div>
                                <div>
                                    <label style={label}>Account Type</label>
                                    <select
                                        value={md.accountType || 'Personal'}
                                        onChange={e => updateMethod(m.key, 'accountType', e.target.value)}
                                        style={input}
                                    >
                                        <option value="Personal">Personal</option>
                                        <option value="Agent">Agent</option>
                                        <option value="Merchant">Merchant</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Instructions */}
            <div style={card}>
                <label style={label}>Payment Instructions (shown to customer)</label>
                <textarea
                    value={p.instructions || ''}
                    onChange={e => updateInstructions(e.target.value)}
                    placeholder="e.g. Send Money to the number above, then submit your number, transaction ID and time."
                    rows={2}
                    style={{ ...input, resize: 'vertical' as const, fontFamily: 'inherit' }}
                />
            </div>
        </div>
    );
}

/* ─── FOOTER TAB ─── */
function FooterTab({ data, setData }: { data: any; setData: any }) {
    const f = data.footer || {};
    const update = (field: string, value: any) => setData((p: any) => ({ ...p, footer: { ...p.footer, [field]: value } }));

    return (
        <div style={card}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 6px' }}>Footer Settings</h3>
            <p style={{ fontSize: '12px', color: '#888', margin: '0 0 16px' }}>Manage footer text and descriptions displayed at the bottom of every page.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={label}>Company Name</label><input value={f.companyName || ''} onChange={e => update('companyName', e.target.value)} placeholder="Bichitra Point" style={input} /></div>
                <div><label style={label}>Copyright Text (optional)</label><input value={f.copyright || ''} onChange={e => update('copyright', e.target.value)} placeholder="Leave empty for auto current year" style={input} /></div>
                <div style={{ gridColumn: '1 / -1' }}>
                    <label style={label}>Footer About / Brand Description (shown below logo)</label>
                    <textarea
                        value={f.aboutText || ''}
                        onChange={e => update('aboutText', e.target.value)}
                        placeholder="Bichitra Point is a books and stationery retail chain, specializing in English medium textbooks, English novels, office stationery, and art & craft supplies. We deliver anywhere in Bangladesh within a maximum of 4 days."
                        rows={3}
                        style={{ ...input, resize: 'vertical' as const, fontFamily: 'inherit' }}
                    />
                </div>
            </div>
            <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                    💡 <strong>Tip:</strong> Social media links (Facebook, WhatsApp, Instagram, YouTube, etc.) and Contact details shown in the footer are managed in the <strong>Contact Page</strong> tab.
                </p>
            </div>
        </div>
    );
}

/* ─── LEGAL PAGES TAB ─── */
function LegalPagesTab() {
    const { data: legalRes, isLoading } = useGetAllLegalPagesQuery({});
    const [updateLegalPage, { isLoading: isSavingLegal }] = useUpdateLegalPageMutation();
    const [editingSlug, setEditingSlug] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');

    const pages = legalRes?.data || [];

    const LEGAL_PAGES = [
        { slug: 'about', label: 'About Us', icon: '🏢', color: '#10b981' },
        { slug: 'terms', label: 'Terms & Conditions', icon: '📜', color: 'var(--color-primary)' },
        { slug: 'privacy', label: 'Privacy Policy', icon: '🛡️', color: '#2563eb' },
        { slug: 'refund', label: 'Refund Policy', icon: '🔄', color: '#d97706' },
    ];

    const startEdit = (slug: string) => {
        const page = pages.find((p: any) => p.slug === slug);
        setEditingSlug(slug);
        setEditTitle(page?.title || LEGAL_PAGES.find(l => l.slug === slug)?.label || '');
        setEditContent(page?.content || '');
    };

    const handleSaveLegal = async () => {
        if (!editingSlug) return;
        try {
            await updateLegalPage({ slug: editingSlug, data: { title: editTitle, content: editContent } }).unwrap();
            toast.success(`${editTitle} saved!`);
            setEditingSlug(null);
        } catch {
            toast.error('Failed to save');
        }
    };

    if (isLoading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ width: '28px', height: '28px', border: '3px solid #e5e7eb', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
            </div>
        );
    }

    // Editing Mode
    if (editingSlug) {
        const meta = LEGAL_PAGES.find(l => l.slug === editingSlug);
        return (
            <div>
                <div style={{ ...card, borderColor: meta?.color + '40' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '20px' }}>{meta?.icon}</span>
                            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Editing: {meta?.label}</h3>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => setEditingSlug(null)} style={{ ...btn, background: '#f3f4f6', color: '#555' }}>Cancel</button>
                            <button onClick={handleSaveLegal} disabled={isSavingLegal} style={{ ...btnPrimary, opacity: isSavingLegal ? 0.6 : 1 }}>
                                <LuSave size={13} /> {isSavingLegal ? 'Saving...' : 'Save Page'}
                            </button>
                        </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <label style={label}>Page Title</label>
                        <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={input} placeholder="Page title..." />
                    </div>

                    <div>
                        <label style={label}>Page Content</label>
                        <div className="legal-editor-wrapper" style={{ background: '#fff', borderRadius: '8px', border: '1.5px solid #e5e7eb', overflow: 'hidden' }}>
                            <ReactQuill
                                theme="snow"
                                value={editContent}
                                onChange={(value: string) => setEditContent(value)}
                                placeholder="Write your page content here..."
                                modules={{
                                    toolbar: [
                                        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                                        [{ 'font': [] }],
                                        [{ 'size': ['small', false, 'large', 'huge'] }],
                                        ['bold', 'italic', 'underline', 'strike'],
                                        [{ 'color': [] }, { 'background': [] }],
                                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                        [{ 'indent': '-1' }, { 'indent': '+1' }],
                                        [{ 'align': [] }],
                                        ['link', 'image', 'video'],
                                        ['blockquote', 'code-block'],
                                        ['clean'],
                                    ],
                                }}
                                style={{ minHeight: '400px' }}
                            />
                        </div>
                        <style>{`
                            .legal-editor-wrapper .ql-toolbar { border: none !important; border-bottom: 1px solid #e5e7eb !important; background: #f9fafb; padding: 10px 12px !important; }
                            .legal-editor-wrapper .ql-container { border: none !important; font-size: 14px; font-family: inherit; }
                            .legal-editor-wrapper .ql-editor { min-height: 400px; padding: 20px 24px; line-height: 1.8; }
                            .legal-editor-wrapper .ql-editor h1 { font-size: 22px; font-weight: 800; margin: 20px 0 10px; }
                            .legal-editor-wrapper .ql-editor h2 { font-size: 18px; font-weight: 700; margin: 18px 0 8px; }
                            .legal-editor-wrapper .ql-editor h3 { font-size: 15px; font-weight: 600; margin: 14px 0 6px; }
                            .legal-editor-wrapper .ql-editor p { margin-bottom: 10px; }
                            .legal-editor-wrapper .ql-editor img { max-width: 100%; border-radius: 8px; margin: 12px 0; }
                        `}</style>
                    </div>
                </div>
            </div>
        );
    }

    // List Mode
    return (
        <div>
            <div style={{ ...card, background: 'var(--color-primary-surface)', borderColor: '#bbf7d0' }}>
                <p style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600, margin: 0 }}>
                    ✅ These pages are live at: <strong>/about</strong>, <strong>/terms</strong>, <strong>/privacy</strong>, <strong>/refund</strong>
                </p>
            </div>
            {LEGAL_PAGES.map(lp => {
                const page = pages.find((p: any) => p.slug === lp.slug);
                const hasContent = page?.content && page.content.length > 10;
                return (
                    <div key={lp.slug} style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '24px' }}>{lp.icon}</span>
                            <div>
                                <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 2px', color: '#111' }}>{lp.label}</h4>
                                <p style={{ fontSize: '11px', color: '#999', margin: 0 }}>
                                    {hasContent ? `${page.content.replace(/<[^>]+>/g, '').substring(0, 80)}...` : 'No content yet'}
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                                fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px',
                                background: hasContent ? 'var(--color-primary-lightest)' : '#fef2f2',
                                color: hasContent ? '#16a34a' : '#dc2626',
                                textTransform: 'uppercase',
                            }}>
                                {hasContent ? 'Published' : 'Empty'}
                            </span>
                            <button onClick={() => startEdit(lp.slug)} style={{ ...btnSmall, fontWeight: 700 }}>
                                ✏️ Edit
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ─── HERO SLIDES TAB ─── */
function HeroSlidesTab({ data, setData, onSave, isSaving }: { data: any; setData: any; onSave: () => void; isSaving: boolean }) {
    const slides = data.heroSlides || [];

    // The homepage carousel re-sorts slides by their numeric `order`, so every mutation
    // must renumber `order` to match the array position — otherwise reordering/removal
    // saves fine but the live homepage restores the original sequence.
    const renumber = (arr: any[]) => arr.map((s: any, i: number) => ({ ...s, order: i }));
    const commit = (arr: any[]) => setData((p: any) => ({ ...p, heroSlides: renumber(arr) }));

    // const addSlide = (imageUrl: string) => {
    //     if (!imageUrl) return;
    //     commit([...slides, { imageUrl, active: true }]);
    // };

    // Bulk-add: append every uploaded image as a new slide.
    const addSlides = (urls: string[]) => {
        const clean = (urls || []).filter(Boolean);
        if (!clean.length) return;
        commit([...slides, ...clean.map((imageUrl) => ({ imageUrl, active: true }))]);
    };

    const updateSlide = (idx: number, field: string, value: any) => {
        commit(slides.map((s: any, i: number) => (i === idx ? { ...s, [field]: value } : s)));
    };

    // Mid-page promo banner — a single object, saved alongside the slides.
    const banner = data.homeBanner || {};
    const updateBanner = (field: string, value: any) => {
        setData((p: any) => ({ ...p, homeBanner: { ...(p.homeBanner || {}), [field]: value } }));
    };

    const removeSlide = (idx: number) => {
        commit(slides.filter((_: any, i: number) => i !== idx));
    };

    const moveSlide = (idx: number, direction: 'up' | 'down') => {
        const newSlides = [...slides];
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= newSlides.length) return;
        [newSlides[idx], newSlides[swapIdx]] = [newSlides[swapIdx], newSlides[idx]];
        commit(newSlides);
    };

    const handleSaveHero = async () => {
        // Update heroSlides in formData then trigger parent save
        onSave();
    };

    return (
        <div>
            {/* Info */}
            <div style={{ ...card, background: '#fffbeb', borderColor: '#fde68a' }}>
                <p style={{ fontSize: '12px', color: '#b45309', fontWeight: 600, margin: 0 }}>
                    🖼️ Hero slides appear at the top of your homepage as a banner carousel. Add multiple images and they will auto-rotate.
                    Recommended size <strong>1420 × 370</strong>. Headline / sub-text / button are drawn as live text over the banner —
                    set <strong>Text: Left / Right</strong> to match the empty side of your artwork, and leave the text fields blank
                    if the image already has its own wording baked in.
                </p>
            </div>

            {/* Current Slides */}
            {slides.length > 0 && (
                <div style={{ ...card }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px' }}>Current Slides ({slides.length})</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                        {slides.map((slide: any, idx: number) => (
                            <div key={idx} style={{
                                position: 'relative', borderRadius: '10px', overflow: 'hidden',
                                border: '1px solid #e5e7eb', background: '#f9fafb',
                            }}>
                                <img
                                    src={slide.imageUrl}
                                    alt={`Slide ${idx + 1}`}
                                    style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                                />
                                {/* Live text overlay — leave every field blank for a banner
                                    whose artwork already carries its own wording. */}
                                <div style={{ padding: '8px 8px 0', display: 'grid', gap: '6px' }}>
                                    <input
                                        value={slide.title || ''}
                                        onChange={e => updateSlide(idx, 'title', e.target.value)}
                                        placeholder="Headline (optional)"
                                        style={{ ...input, padding: '6px 8px', fontSize: '11px' }}
                                    />
                                    <input
                                        value={slide.subtitle || ''}
                                        onChange={e => updateSlide(idx, 'subtitle', e.target.value)}
                                        placeholder="Sub-text (optional)"
                                        style={{ ...input, padding: '6px 8px', fontSize: '11px' }}
                                    />
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <input
                                            value={slide.ctaLabel || ''}
                                            onChange={e => updateSlide(idx, 'ctaLabel', e.target.value)}
                                            placeholder="Button text"
                                            style={{ ...input, padding: '6px 8px', fontSize: '11px' }}
                                        />
                                        <input
                                            value={slide.ctaHref || ''}
                                            onChange={e => updateSlide(idx, 'ctaHref', e.target.value)}
                                            placeholder="/products"
                                            style={{ ...input, padding: '6px 8px', fontSize: '11px' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <select
                                            value={slide.align || 'left'}
                                            onChange={e => updateSlide(idx, 'align', e.target.value)}
                                            style={{ ...input, padding: '6px 8px', fontSize: '11px' }}
                                            title="Which side of the artwork the text sits on"
                                        >
                                            <option value="left">Text: Left</option>
                                            <option value="center">Text: Center</option>
                                            <option value="right">Text: Right</option>
                                        </select>
                                        <select
                                            value={slide.textTone || 'light'}
                                            onChange={e => updateSlide(idx, 'textTone', e.target.value)}
                                            style={{ ...input, padding: '6px 8px', fontSize: '11px' }}
                                            title="Use light text on dark banners"
                                        >
                                            <option value="light">Light text</option>
                                            <option value="dark">Dark text</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ padding: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#555' }}>Slide {idx + 1}</span>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button
                                            onClick={() => moveSlide(idx, 'up')}
                                            disabled={idx === 0}
                                            style={{ ...btnSmall, padding: '4px 6px', opacity: idx === 0 ? 0.3 : 1 }}
                                            title="Move Up"
                                        >
                                            <LuArrowUp size={12} />
                                        </button>
                                        <button
                                            onClick={() => moveSlide(idx, 'down')}
                                            disabled={idx === slides.length - 1}
                                            style={{ ...btnSmall, padding: '4px 6px', opacity: idx === slides.length - 1 ? 0.3 : 1 }}
                                            title="Move Down"
                                        >
                                            <LuArrowDown size={12} />
                                        </button>
                                        <button
                                            onClick={() => removeSlide(idx)}
                                            style={{ ...btnSmall, padding: '4px 6px', background: '#fef2f2', color: '#dc2626' }}
                                            title="Delete"
                                        >
                                            <LuTrash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add New Slides — upload one or many at once */}
            <div style={card}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 6px' }}>Add Banner Images</h3>
                <p style={{ fontSize: '11px', color: '#888', margin: '0 0 8px' }}>
                    Select <strong>one or more</strong> images at once — each becomes a slide that auto-rotates on the homepage. You can reorder or remove them above, and change them anytime.
                </p>
                <div style={{
                    fontSize: '12px', color: '#b45309', fontWeight: 700, margin: '0 0 14px',
                    background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '8px 12px',
                }}>
                    📐 Recommended banner size: <strong>1420 × 370 px</strong> (wide &amp; short) &nbsp;·&nbsp; JPG / PNG / WebP &nbsp;·&nbsp; under 10&nbsp;MB each.
                    <br />Design all banners at this exact size so every slide looks sharp and aligned.
                </div>
                <MultipleImageUploader
                    label="Banner Images"
                    values={[]}
                    onChange={(urls) => addSlides(urls)}
                    max={10}
                />
            </div>

            {/* ── Mid-page promo banner ── */}
            <div style={card}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 6px' }}>🎯 Homepage Promo Banner</h3>
                <p style={{ fontSize: '11px', color: '#888', margin: '0 0 12px' }}>
                    A single wide banner shown on the homepage <strong>between “Popular Products” and “New Arrivals”</strong>.
                    Leave the image empty (or switch it off) to hide the section entirely. Same recommended size — <strong>1420 × 370 px</strong>.
                </p>

                <div style={{ display: 'grid', gap: '10px' }}>
                    <SingleImageUploader
                        label="Banner Image"
                        value={banner.imageUrl || ''}
                        onChange={(url: string) => updateBanner('imageUrl', url)}
                    />

                    {banner.imageUrl && (
                        <img
                            src={banner.imageUrl}
                            alt="Promo banner preview"
                            style={{ width: '100%', maxHeight: '130px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                        />
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                            <label style={label}>Show on homepage</label>
                            <select
                                value={banner.active === false ? 'false' : 'true'}
                                onChange={e => updateBanner('active', e.target.value === 'true')}
                                style={input}
                            >
                                <option value="true">Yes — visible</option>
                                <option value="false">No — hidden</option>
                            </select>
                        </div>
                        <div>
                            <label style={label}>Click goes to</label>
                            <input
                                value={banner.link || ''}
                                onChange={e => updateBanner('link', e.target.value)}
                                placeholder="/products"
                                style={input}
                            />
                        </div>
                    </div>

                    <p style={{ fontSize: '11px', color: '#888', margin: '4px 0 0' }}>
                        Text below is optional — leave blank if your artwork already has its own wording.
                    </p>

                    <div><label style={label}>Headline</label>
                        <input value={banner.title || ''} onChange={e => updateBanner('title', e.target.value)} style={input} /></div>
                    <div><label style={label}>Sub-text</label>
                        <input value={banner.subtitle || ''} onChange={e => updateBanner('subtitle', e.target.value)} style={input} /></div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                        <div><label style={label}>Button text</label>
                            <input value={banner.ctaLabel || ''} onChange={e => updateBanner('ctaLabel', e.target.value)} style={input} /></div>
                        <div>
                            <label style={label}>Text side</label>
                            <select value={banner.align || 'left'} onChange={e => updateBanner('align', e.target.value)} style={input}>
                                <option value="left">Left</option>
                                <option value="center">Center</option>
                                <option value="right">Right</option>
                            </select>
                        </div>
                        <div>
                            <label style={label}>Text colour</label>
                            <select value={banner.textTone || 'light'} onChange={e => updateBanner('textTone', e.target.value)} style={input}>
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button onClick={handleSaveHero} disabled={isSaving} style={{ ...btnPrimary, opacity: isSaving ? 0.6 : 1 }}>
                    <LuSave size={13} /> {isSaving ? 'Saving...' : 'Save Banners'}
                </button>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* ─── CATEGORY ROWS TAB ─── */
function CategoryRowsTab({ data, setData, onSave, isSaving }: { data: any; setData: any; onSave: () => void; isSaving: boolean }) {
    const { data: categoriesRes, isLoading: catsLoading } = useGetCategoriesQuery({});
    const categories: any[] = categoriesRes?.data || [];
    const [selectedCatId, setSelectedCatId] = useState('');
    const [subtitleInput, setSubtitleInput] = useState('');

    const rows: any[] = data?.categoryRows || [];

    const handleAddRow = () => {
        if (!selectedCatId) {
            toast.error('Please select a category first');
            return;
        }
        const cat = categories.find((c: any) => c._id === selectedCatId);
        if (!cat) return;

        // Check if category already added
        const exists = rows.some((r: any) => (r.categorySlug && r.categorySlug === cat.slug) || (r.categoryId && r.categoryId === cat._id));
        if (exists) {
            toast.error(`"${cat.name}" is already in the category rows list`);
            return;
        }

        const newRow = {
            categoryId: cat._id,
            categoryName: cat.name,
            categorySlug: cat.slug,
            subtitle: subtitleInput.trim(),
            active: true,
            order: rows.length,
        };

        setData((prev: any) => ({
            ...prev,
            categoryRows: [...(prev.categoryRows || []), newRow],
        }));

        setSelectedCatId('');
        setSubtitleInput('');
        toast.success(`Added "${cat.name}" section row! Click "Save Changes" to apply.`);
    };

    const handleMove = (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= rows.length) return;

        const updated = [...rows];
        const temp = updated[index];
        updated[index] = updated[targetIndex];
        updated[targetIndex] = temp;

        // Re-assign order numbers
        updated.forEach((r, idx) => { r.order = idx; });

        setData((prev: any) => ({
            ...prev,
            categoryRows: updated,
        }));
    };

    const handleToggleActive = (index: number) => {
        const updated = [...rows];
        updated[index] = { ...updated[index], active: !updated[index].active };
        setData((prev: any) => ({
            ...prev,
            categoryRows: updated,
        }));
    };

    const handleUpdateField = (index: number, field: string, val: string) => {
        const updated = [...rows];
        updated[index] = { ...updated[index], [field]: val };
        setData((prev: any) => ({
            ...prev,
            categoryRows: updated,
        }));
    };

    const handleRemove = (index: number) => {
        const rowName = rows[index]?.categoryName || 'section';
        if (window.confirm(`Remove "${rowName}" row from homepage?`)) {
            const updated = rows.filter((_, idx) => idx !== index);
            updated.forEach((r, idx) => { r.order = idx; });
            setData((prev: any) => ({
                ...prev,
                categoryRows: updated,
            }));
            toast.success(`Removed "${rowName}" row. Click "Save Changes" to apply.`);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header info */}
            <div style={{ ...card, background: 'linear-gradient(to right, #f8fafc, #fff)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                        <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <LuLayoutGrid style={{ color: 'var(--color-primary)' }} />
                            Homepage Category Product Rows
                        </h3>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                            Select categories to showcase as dedicated horizontal product rows on your homepage. You can freely reorder (Up/Down), enable/disable, or remove any row.
                        </p>
                    </div>
                    <button onClick={onSave} disabled={isSaving} style={{ ...btnPrimary, opacity: isSaving ? 0.6 : 1 }}>
                        <LuSave size={13} /> {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Add New Category Row Card */}
            <div style={card}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <LuPlus size={15} style={{ color: 'var(--color-primary)' }} />
                    Add Category Section to Homepage
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
                    <div>
                        <label style={label}>Select Category <span style={{ color: '#ef4444' }}>*</span></label>
                        <select
                            value={selectedCatId}
                            onChange={(e) => setSelectedCatId(e.target.value)}
                            disabled={catsLoading}
                            style={{ ...input, background: '#fff' }}
                        >
                            <option value="">-- Choose Category --</option>
                            {categories.map((c: any) => (
                                <option key={c._id} value={c._id}>
                                    {c.name} ({c.slug})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={label}>Optional Subtitle / Description</label>
                        <input
                            type="text"
                            placeholder="e.g. Official endorsed textbooks and study guides."
                            value={subtitleInput}
                            onChange={(e) => setSubtitleInput(e.target.value)}
                            style={input}
                        />
                    </div>
                    <div>
                        <button
                            type="button"
                            onClick={handleAddRow}
                            style={{
                                ...btnPrimary,
                                width: '100%',
                                justifyContent: 'center',
                                padding: '9px 18px',
                            }}
                        >
                            <LuPlus size={15} /> Add Section Row
                        </button>
                    </div>
                </div>
            </div>

            {/* Configured Rows List */}
            <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', margin: 0 }}>
                        Configured Rows ({rows.length})
                    </h4>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Rows appear on homepage in this order from top to bottom
                    </span>
                </div>

                {rows.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 20px', color: '#94a3b8', fontSize: '13px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                        No category rows configured yet. Select a category above to add your first row!
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {rows.map((row: any, idx: number) => {
                            const isActive = row.active !== false;
                            return (
                                <div
                                    key={row._id || `${row.categorySlug}-${idx}`}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '12px',
                                        padding: '12px 14px',
                                        background: isActive ? '#fff' : '#f8fafc',
                                        border: '1.5px solid',
                                        borderColor: isActive ? '#e2e8f0' : '#cbd5e1',
                                        borderRadius: '8px',
                                        transition: 'all 0.15s',
                                        opacity: isActive ? 1 : 0.65,
                                    }}
                                >
                                    {/* Left: Reorder Up/Down + Position Badge */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                        <div style={{
                                            width: '24px', height: '24px', borderRadius: '4px',
                                            background: 'var(--color-primary-lightest)', color: 'var(--color-primary)',
                                            fontWeight: 800, fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {idx + 1}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <button
                                                type="button"
                                                onClick={() => handleMove(idx, 'up')}
                                                disabled={idx === 0}
                                                title="Move Up"
                                                style={{
                                                    ...btnSmall,
                                                    padding: '2px 5px',
                                                    cursor: idx === 0 ? 'not-allowed' : 'pointer',
                                                    opacity: idx === 0 ? 0.3 : 1,
                                                }}
                                            >
                                                <LuArrowUp size={12} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleMove(idx, 'down')}
                                                disabled={idx === rows.length - 1}
                                                title="Move Down"
                                                style={{
                                                    ...btnSmall,
                                                    padding: '2px 5px',
                                                    cursor: idx === rows.length - 1 ? 'not-allowed' : 'pointer',
                                                    opacity: idx === rows.length - 1 ? 0.3 : 1,
                                                }}
                                            >
                                                <LuArrowDown size={12} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Middle: Category Name, Slug, Subtitle input */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#1e293b' }}>
                                                {row.categoryName}
                                            </span>
                                            <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#64748b', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
                                                slug: {row.categorySlug}
                                            </span>
                                            <span style={{
                                                fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '12px',
                                                background: isActive ? '#ecfdf5' : '#f1f5f9',
                                                color: isActive ? '#059669' : '#64748b',
                                                border: isActive ? '1px solid #a7f3d0' : '1px solid #e2e8f0'
                                            }}>
                                                {isActive ? 'ACTIVE' : 'HIDDEN'}
                                            </span>
                                        </div>
                                        <div style={{ marginTop: '5px' }}>
                                            <input
                                                type="text"
                                                placeholder="Custom subtitle (optional)"
                                                value={row.subtitle || ''}
                                                onChange={(e) => handleUpdateField(idx, 'subtitle', e.target.value)}
                                                style={{ ...input, padding: '4px 8px', fontSize: '11.5px', maxWidth: '420px' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Right: Toggle Active + Delete */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                                            <input
                                                type="checkbox"
                                                checked={isActive}
                                                onChange={() => handleToggleActive(idx)}
                                            />
                                            Visible
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => handleRemove(idx)}
                                            title="Delete Row"
                                            style={btnDanger}
                                        >
                                            <LuTrash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

