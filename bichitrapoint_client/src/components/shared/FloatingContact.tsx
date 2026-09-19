/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { FaWhatsapp, FaRobot, FaFacebookMessenger } from 'react-icons/fa';
import { LuX, LuSend, LuMessageCircle, LuHeadphones, LuSparkles, LuPhone } from 'react-icons/lu';
import { useRouter, usePathname } from 'next/navigation';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import { useAppSelector } from '@/redux';
import { useGetChatSessionQuery, useSendChatMessageMutation } from '@/redux/api/chatApi';

const PRIMARY = 'var(--color-primary)';

type Action = { label: string; href?: string; topic?: Topic };
type Msg = { from: 'bot' | 'user' | 'admin'; text: string; senderName?: string; actions?: Action[]; createdAt?: string | Date };
type Topic = 'order' | 'delivery' | 'payment' | 'track' | 'contact' | 'hi' | 'inquiry';

const QUICK: Action[] = [
    { label: '🛒 How to order', topic: 'order' },
    { label: '🚚 Delivery', topic: 'delivery' },
    { label: '💳 Payment', topic: 'payment' },
    { label: '📦 Track order', topic: 'track' },
    { label: '📞 Contact', topic: 'contact' },
];

const FloatingContact: React.FC = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { data: res } = useGetSiteContentQuery({});
    const { isAuthenticated, user } = useAppSelector((s) => s.auth);

    // Hide floating widget entirely on all dashboard routes
    const isDashboard = pathname?.startsWith('/dashboard');

    const f = res?.data?.floating;
    const contact = res?.data?.contact || {};
    const payment = res?.data?.payment || {};

    const showWhatsapp = f?.showWhatsapp !== false;
    const digits = (contact.whatsapp || f?.whatsapp || '').replace(/\D/g, '');
    const whatsappNumber = digits.startsWith('880') ? digits : digits.startsWith('0') ? '88' + digits : digits ? '880' + digits : '';
    const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}` : '';

    const phone = contact.phone || '';
    const email = contact.email || contact.emails?.[0] || '';
    const address = contact.address || '';
    const storeName = res?.data?.general?.storeName || 'Bichitra Point';

    // ── Session State ───────────────────────────────────────────
    const [sessionId, setSessionId] = useState<string>('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            let sId = localStorage.getItem('bcp_chat_session_id');
            if (!sId) {
                sId = 'session_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
                localStorage.setItem('bcp_chat_session_id', sId);
            }
            setSessionId(sId);
        }
    }, []);

    // ── Chat State ──────────────────────────────────────────────
    const [open, setOpen] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [typing, setTyping] = useState(false);
    const [input, setInput] = useState('');

    const defaultInitialMsg: Msg = {
        from: 'bot',
        text: `Hi! 👋 I'm ${storeName}, your shopping assistant. How can I help you today?`,
        actions: QUICK,
    };

    const [messages, setMessages] = useState<Msg[]>([defaultInitialMsg]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const hintShownRef = useRef(false);

    // ── API Integration ─────────────────────────────────────────
    const { data: sessionRes, refetch: refetchSession } = useGetChatSessionQuery(
        { sessionId, markRead: open },
        {
            skip: !sessionId || isDashboard,
            pollingInterval: open ? 3000 : 3500, // Poll every 3.5s so when admin replies, user gets notification immediately!
        }
    );
    const [sendMessageApi] = useSendChatMessageMutation();

    const adminMessages = sessionRes?.data?.messages?.filter((m: any) => m.sender === 'admin') || [];
    const lastAdminMessage = adminMessages[adminMessages.length - 1];
    const unreadCount = !open ? (sessionRes?.data?.unreadUserCount || adminMessages.filter((m: any) => !m.readByUser).length || 0) : 0;

    // Sync remote messages into local state when received
    useEffect(() => {
        if (sessionRes?.data?.messages && sessionRes.data.messages.length > 0) {
            const formatted: Msg[] = sessionRes.data.messages.map((m: any) => ({
                from: (m.sender === 'admin' ? 'admin' : m.sender === 'user' ? 'user' : 'bot') as any,
                text: m.text,
                senderName: m.senderName,
                actions: m.actions && m.actions.length > 0 ? m.actions : undefined,
                createdAt: m.createdAt,
            }));
            setMessages(formatted);
        }
    }, [sessionRes]);

    // Auto-scroll to newest message
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, typing, open]);

    // One-time gentle hint bubble after a few seconds
    useEffect(() => {
        if (hintShownRef.current) return;
        const t = setTimeout(() => {
            if (!open && !unreadCount) { setShowHint(true); hintShownRef.current = true; setTimeout(() => setShowHint(false), 6000); }
        }, 4000);
        return () => clearTimeout(t);
    }, [open, unreadCount]);

    // Lock body scroll when open on mobile
    useEffect(() => {
        const mobile = typeof window !== 'undefined' && window.innerWidth < 640;
        if (open && mobile) { document.body.style.overflow = 'hidden'; }
        else { document.body.style.overflow = ''; }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    // If on dashboard routes, do not render floating widget
    if (isDashboard) return null;

    const labelFor = (k: string) => (k === 'bkash' ? 'bKash' : k === 'nagad' ? 'Nagad' : k === 'rocket' ? 'Rocket' : k);

    const buildAnswer = (topic: Topic, userText?: string): Msg => {
        switch (topic) {
            case 'order':
                return {
                    from: 'bot',
                    text: "Ordering is easy:\n1️⃣ Browse products & open one you like\n2️⃣ Choose product, then tap “Add to Cart” or “Buy Now”\n3️⃣ Go to Cart → Checkout\n4️⃣ Fill your address & choose a payment method\n5️⃣ Confirm — done! 🎉",
                    actions: [{ label: 'Browse products', href: '/products' }, { label: 'View cart', href: '/cart' }],
                };
            case 'delivery':
                return {
                    from: 'bot',
                    text: "🚚 We deliver across Bangladesh.\n• Inside Dhaka: usually 1–3 days\n• Outside Dhaka: usually 3–5 days\n• Cash on Delivery is available\nYou’ll get a tracking update once your order ships.",
                    actions: [{ label: 'Track my order', topic: 'track' }],
                };
            case 'payment': {
                const lines = ['bkash', 'rocket', 'nagad']
                    .filter((k) => payment?.[k]?.active !== false && payment?.[k]?.number)
                    .map((k) => `• ${labelFor(k)}: ${payment[k].number} (${payment[k].accountType || 'Personal'})`);
                const body = lines.length
                    ? `We accept:\n${lines.join('\n')}\n• Cash on Delivery (COD)\n\nSend money to the number, then enter the Transaction ID at checkout.`
                    : "We accept bKash, Nagad, Rocket and Cash on Delivery (COD). The active numbers are shown on the checkout page.";
                return { from: 'bot', text: `💳 ${body}`, actions: [{ label: 'Go to checkout', href: '/cart' }] };
            }
            case 'track':
                return {
                    from: 'bot',
                    text: isAuthenticated
                        ? "📦 You can see live status of every order in your dashboard."
                        : "📦 Please log in to track your orders — then you’ll see live status for each one.",
                    actions: [{ label: isAuthenticated ? 'Open My Orders' : 'Login to track', href: isAuthenticated ? '/dashboard/user/orders' : '/login?redirect=/dashboard/user/orders' }],
                };
            case 'contact': {
                const lines = [
                    phone && `• Phone: ${phone}`,
                    email && `• Email: ${email}`,
                    address && `• Address: ${address}`,
                ].filter(Boolean);
                return {
                    from: 'bot',
                    text: lines.length
                        ? `📞 We’re here to help:\n${lines.join('\n')}`
                        : `📞 We’re here to help — please see our Contact page for the latest details.`,
                    actions: [
                        ...(whatsappLink ? [{ label: 'Chat on WhatsApp', href: whatsappLink }] : []),
                        { label: 'Contact page', href: '/contact' },
                    ],
                };
            }
            case 'inquiry':
                return {
                    from: 'bot',
                    text: "Thank you for your message! Our live support team has received it and will reply right here in this chat.\n\nFor urgent assistance, feel free to call or WhatsApp us anytime.",
                    actions: [
                        ...(whatsappLink ? [{ label: '💬 Chat on WhatsApp', href: `${whatsappLink}${whatsappLink.includes('?') ? '&' : '?'}text=${encodeURIComponent(userText || 'Hello, I have an inquiry')}` }] : []),
                        ...(phone ? [{ label: `📞 Call (${phone})`, href: `tel:${phone}` }] : []),
                        { label: '🛒 Browse products', href: '/products' },
                    ],
                };
            default:
                return { from: 'bot', text: "I’m here to help! Pick a topic below 👇", actions: QUICK };
        }
    };

    const matchTopic = (text: string): Topic => {
        const t = text.toLowerCase().trim();
        if (/(how (to|can|do) (i )?order|kivabe order|order kivabe|kivabe kinbo|order korbo|order system|how.*order|\border\b)/i.test(t)) return 'order';
        if (/(deliver|shipping|ship|koto din|how long|courier|charge|delivery charge)/i.test(t)) return 'delivery';
        if (/(payment method|bkash|nagad|rocket|cod|cash on delivery|kivabe taka|payment|pay)/i.test(t)) return 'payment';
        if (/(track order|order status|where is my order|kothay order|track|status)/i.test(t)) return 'track';
        if (/(contact|phone|email|call|hotline|support|number|helpline)/i.test(t)) return 'contact';
        if (/^(hi|hello|hey|salam|assalamu alaikum|hlw|oi|halo)\b/i.test(t)) return 'hi';
        return 'inquiry';
    };

    const handleSendMessage = async (text: string, topic?: Topic) => {
        if (!text.trim() || !sessionId) return;
        setInput('');

        const matchedTopic = topic || matchTopic(text);
        const botReply = matchedTopic === 'hi'
            ? { from: 'bot' as const, text: "Hello! 😊 What can I help you with?", actions: QUICK }
            : buildAnswer(matchedTopic, text);

        // Optimistically add user message & show typing
        setMessages((prev) => [...prev, { from: 'user', text }]);
        setTyping(true);

        try {
            const res = await sendMessageApi({
                sessionId,
                text,
                customerName: (user as any)?.name || undefined,
                customerEmail: (user as any)?.email || undefined,
                customerPhone: (user as any)?.phone || undefined,
                botReply: {
                    text: botReply.text,
                    actions: botReply.actions || [],
                },
            }).unwrap();

            setTimeout(() => {
                setTyping(false);
                if (res?.data?.messages && res.data.messages.length > 0) {
                    const formatted: Msg[] = res.data.messages.map((m: any) => ({
                        from: (m.sender === 'admin' ? 'admin' : m.sender === 'user' ? 'user' : 'bot') as any,
                        text: m.text,
                        senderName: m.senderName,
                        actions: m.actions && m.actions.length > 0 ? m.actions : undefined,
                        createdAt: m.createdAt,
                    }));
                    setMessages(formatted);
                }
            }, 350);
        } catch {
            setTyping(false);
            setMessages((prev) => [...prev, botReply]);
        }
    };

    const handleTopic = (topic: Topic, label?: string) => {
        const userText = label || topic;
        handleSendMessage(userText, topic);
    };

    const handleSend = () => {
        const text = input.trim();
        if (!text) return;
        handleSendMessage(text);
    };

    const onAction = (a: Action) => {
        if (a.href) {
            if (a.href.startsWith('http')) window.open(a.href, '_blank');
            else router.push(a.href);
            return;
        }
        if (a.topic) handleTopic(a.topic, a.label);
    };

    const handleOpenChat = () => {
        setOpen(true);
        setShowHint(false);
        refetchSession();
    };

    return (
        <>
            {/* ── Chat Panel ── */}
            {open && (
                <div
                    className="fixed z-[10000] shadow-2xl flex flex-col overflow-hidden bg-white
                               right-3 left-3 bottom-3
                               sm:left-auto sm:right-4 sm:bottom-24
                               sm:w-[380px]"
                    style={{
                        borderRadius: '16px',
                        height: 'min(560px, calc(100dvh - 1.5rem))',
                        maxHeight: 'calc(100dvh - 1.5rem)',
                        border: '1px solid #e5e7eb',
                        animation: 'preloaderFadeUp 0.25s ease-out both',
                    }}
                >
                    {/* Header */}
                    <div
                        className="flex items-center gap-3 px-4 py-3 text-white shrink-0 shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, #ff8c5a 100%)` }}
                    >
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur text-white">
                                <FaRobot size={20} />
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 ring-2 ring-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold leading-tight flex items-center gap-1.5">
                                {storeName} Assistant
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/20 font-medium">AI & Live</span>
                            </p>
                            <p className="text-[11px] opacity-90 flex items-center gap-1 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-300 inline-block animate-pulse" /> Online · Instant replies & Live Support
                            </p>
                        </div>
                        <button onClick={() => setOpen(false)} aria-label="Close chat"
                            className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors">
                            <LuX size={18} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto px-3.5 py-4 space-y-3.5" style={{ background: '#f8fafc' }}>
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className="max-w-[85%]">
                                    {/* Header Label */}
                                    {m.from === 'bot' && (
                                        <div className="flex items-center gap-1.5 mb-1 text-[10px] font-semibold text-gray-400">
                                            <FaRobot size={10} className="text-gray-400" /> {storeName} AI Assistant
                                        </div>
                                    )}
                                    {m.from === 'admin' && (
                                        <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-[var(--color-primary)]">
                                            <LuHeadphones size={11} /> {m.senderName || 'Support Executive'} <span className="text-[9px] bg-[var(--color-primary)]/10 px-1.5 py-0.5 rounded-full font-bold">Staff</span>
                                        </div>
                                    )}

                                    {/* Bubble */}
                                    <div
                                        className="text-[13px] leading-relaxed whitespace-pre-line px-3.5 py-2.5 shadow-xs"
                                        style={
                                            m.from === 'user'
                                                ? { background: PRIMARY, color: '#fff', borderRadius: '14px 14px 4px 14px' }
                                                : m.from === 'admin'
                                                ? { background: '#fff', color: '#1e293b', borderRadius: '14px 14px 14px 4px', border: '1.5px solid rgba(var(--color-primary-rgb), 0.35)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }
                                                : { background: '#fff', color: '#374151', borderRadius: '14px 14px 14px 4px', border: '1px solid #e2e8f0' }
                                        }
                                    >
                                        {m.text}
                                    </div>

                                    {/* Quick Actions Buttons */}
                                    {m.actions && m.actions.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {m.actions.map((a, j) => (
                                                <button
                                                    key={j}
                                                    onClick={() => onAction(a)}
                                                    className="text-[12px] font-semibold px-3 py-1.5 rounded-full border transition-all hover:scale-105 active:scale-95"
                                                    style={{ borderColor: 'rgba(var(--color-primary-rgb),0.35)', color: PRIMARY, background: 'rgba(var(--color-primary-rgb),0.08)' }}
                                                >
                                                    {a.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {typing && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-[#e2e8f0] rounded-[14px] rounded-bl-[4px] px-4 py-3 flex gap-1.5 shadow-sm">
                                    {[0, 1, 2].map((i) => (
                                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400"
                                            style={{ animation: `preloaderDotPulse 1.1s ease-in-out ${i * 0.18}s infinite` }} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="shrink-0 border-t border-gray-100 bg-white px-3 py-2.5">
                        <div className="flex items-center gap-2">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                                placeholder="Ask a question or write a message…"
                                className="flex-1 text-[13px] px-3.5 py-2.5 rounded-full bg-gray-100 outline-none focus:bg-white focus:ring-2 transition-all text-gray-800 placeholder-gray-400"
                                style={{ ['--tw-ring-color' as any]: 'rgba(var(--color-primary-rgb),0.3)' }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                aria-label="Send"
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 transition-transform hover:scale-105 disabled:opacity-40"
                                style={{ background: PRIMARY }}
                            >
                                <LuSend size={16} />
                            </button>
                        </div>
                        <p className="text-[9.5px] text-gray-400 text-center mt-1.5 flex items-center justify-center gap-1">
                            <LuSparkles size={10} className="text-amber-500" /> AI powered · Live agent connected
                        </p>
                    </div>
                </div>
            )}

            {/* ── Floating buttons stack ── */}
            <div className="fixed bottom-[72px] right-4 z-[9999] flex flex-col items-end gap-3 sm:bottom-5">
                {/* Chat assistant button */}
                <div className="group relative flex items-center">
                    {/* Unread Reply Notification Bubble or General Hint */}
                    {!open && (
                        unreadCount > 0 ? (
                            <div
                                onClick={handleOpenChat}
                                className="absolute right-full mr-3 bg-gradient-to-r from-red-600 to-rose-600 text-white p-3 rounded-2xl shadow-2xl cursor-pointer w-[240px] animate-bounce border border-white/20"
                            >
                                <div className="flex items-center justify-between gap-1.5 text-[11px] font-black text-rose-100 uppercase tracking-wider">
                                    <span className="flex items-center gap-1.5">
                                        <LuHeadphones size={13} className="text-white animate-pulse" />
                                        Support Executive
                                    </span>
                                    <span className="bg-white/20 text-white px-1.5 py-0.2 rounded text-[10px]">
                                        {unreadCount} new
                                    </span>
                                </div>
                                <p className="text-xs font-semibold text-white mt-1.5 line-clamp-2 leading-snug">
                                    {lastAdminMessage?.text || "You have a new message from support."}
                                </p>
                                <span className="inline-block text-[10.5px] text-rose-100 font-bold underline mt-1.5 hover:text-white">
                                    Click to view & reply →
                                </span>
                                <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-b-[6px] border-l-[6px] border-t-transparent border-b-transparent border-l-rose-600" />
                            </div>
                        ) : (
                            <div className={`absolute right-full mr-2 bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg transition-all duration-200 pointer-events-none
                                ${showHint ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`}>
                                {showHint ? '👋 Need help? Ask me!' : `Chat with ${storeName} Assistant`}
                                <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-gray-900" />
                            </div>
                        )
                    )}

                    <button
                        onClick={() => { setOpen((o) => !o); setShowHint(false); if (!open) refetchSession(); }}
                        aria-label="Open chat assistant"
                        className="w-13 h-13 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform duration-200 relative"
                        style={{ background: `linear-gradient(135deg, ${PRIMARY}, #ff8c5a)`, boxShadow: '0 4px 15px rgba(var(--color-primary-rgb),0.45)' }}
                    >
                        {open ? <LuX size={22} /> : <LuMessageCircle size={24} />}
                        
                        {/* Red unread badge pill if admin replied */}
                        {!open && unreadCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1 rounded-full bg-red-600 text-white text-[11px] font-black flex items-center justify-center ring-2 ring-white shadow-lg animate-pulse">
                                {unreadCount}
                            </span>
                        )}
                        {!open && unreadCount === 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 ring-2 ring-white" />
                        )}
                    </button>
                </div>

                {/* WhatsApp button */}
                {showWhatsapp && whatsappLink && (
                    <div className="group relative flex items-center">
                        <div className="absolute right-full mr-2 bg-[#25D366] text-white text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 pointer-events-none transition-all duration-200 shadow-lg">
                            Chat on WhatsApp
                            <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-[#25D366]" />
                        </div>
                        <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Chat on WhatsApp"
                            className="w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 text-white shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', boxShadow: '0 4px 15px rgba(37, 211, 102, 0.4)' }}
                        >
                            <FaWhatsapp size={24} />
                        </a>
                    </div>
                )}

                {/* Messenger button */}
                {f?.showMessenger !== false && f?.messenger && (
                    <div className="group relative flex items-center">
                        <div className="absolute right-full mr-2 bg-[#0084FF] text-white text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 pointer-events-none transition-all duration-200 shadow-lg">
                            Chat on Messenger
                            <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-[#0084FF]" />
                        </div>
                        <a
                            href={`https://m.me/${f.messenger.replace(/^@/, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Chat on Messenger"
                            className="w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 text-white shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #0084FF, #00C6FF)', boxShadow: '0 4px 15px rgba(0, 132, 255, 0.4)' }}
                        >
                            <FaFacebookMessenger size={22} />
                        </a>
                    </div>
                )}

                {/* Call button */}
                {f?.showPhone !== false && (f?.phone || contact.phone) && (
                    <div className="group relative flex items-center">
                        <div className="absolute right-full mr-2 bg-gray-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 pointer-events-none transition-all duration-200 shadow-lg">
                            Call {f?.phone || contact.phone}
                            <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-gray-800" />
                        </div>
                        <a
                            href={`tel:${f?.phone || contact.phone}`}
                            aria-label="Call Us"
                            className="w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 text-white shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #374151, #1f2937)', boxShadow: '0 4px 15px rgba(55, 65, 81, 0.4)' }}
                        >
                            <LuPhone size={20} />
                        </a>
                    </div>
                )}
            </div>
        </>
    );
};

export default FloatingContact;
