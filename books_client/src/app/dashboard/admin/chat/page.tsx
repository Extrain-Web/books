/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
    LuMessageSquare, LuSearch, LuSend, LuTrash2, LuCircleCheck,
    LuClock, LuUser, LuHeadphones, LuPhone, LuMail,
    LuRefreshCw, LuSparkles, LuCheck, LuArrowLeft,
    LuCheckCheck, LuCopy } from 'react-icons/lu';
import { FaRobot, FaWhatsapp } from 'react-icons/fa';
import {
    useGetAdminConversationsQuery,
    useGetAdminConversationQuery,
    useReplyChatMessageMutation,
    useUpdateChatStatusMutation,
    useDeleteChatSessionMutation,
} from '@/redux/api/chatApi';
import { toast } from 'react-hot-toast';

const QUICK_REPLIES = [
    "Hello! 👋 How can we assist you today?",
    "Thank you for contacting us! We are checking your details.",
    "📦 We deliver across Bangladesh: 1–3 days (Dhaka), 3–5 days (outside Dhaka).",
    "💳 We accept bKash, Nagad, Rocket and Cash on Delivery (COD).",
    "Could you please provide your order number or contact number?",
    "Your order is verified and scheduled for courier dispatch. 🚚",
    "Is there anything else we can help you with?",
];

const AdminChatPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [showMobileList, setShowMobileList] = useState(false);

    // Polling every 3.5s for fresh conversations & live customer messages
    const { data: convsData, isLoading: loadingList, refetch: refetchList } = useGetAdminConversationsQuery(
        { searchTerm: searchTerm || undefined, status: statusFilter !== 'all' ? statusFilter : undefined },
        { pollingInterval: 3500 }
    );

    // Selected conversation query (with active polling)
    const { data: activeConvData, refetch: refetchActive } = useGetAdminConversationQuery(
        selectedSessionId || '',
        { skip: !selectedSessionId, pollingInterval: selectedSessionId ? 2500 : 0 }
    );

    const [replyMutation, { isLoading: isSending }] = useReplyChatMessageMutation();
    const [updateStatusMutation] = useUpdateChatStatusMutation();
    const [deleteMutation] = useDeleteChatSessionMutation();

    const conversations = Array.isArray(convsData?.data?.conversations)
        ? convsData.data.conversations
        : Array.isArray(convsData?.data)
        ? convsData.data
        : [];

    const stats = convsData?.data?.stats || convsData?.meta?.stats || {
        total: conversations.length,
        unread: conversations.filter((c: any) => c.unreadAdminCount > 0).length,
        active: conversations.filter((c: any) => c.status === 'active').length,
        resolved: conversations.filter((c: any) => c.status === 'resolved').length,
    };

    const activeSession = activeConvData?.data || conversations.find((c: any) => c.sessionId === selectedSessionId);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll messages container to bottom on change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeSession?.messages, isSending]);

    // Select the first conversation by default on desktop if none selected
    useEffect(() => {
        if (!selectedSessionId && conversations.length > 0) {
            setSelectedSessionId(conversations[0].sessionId);
        }
    }, [conversations, selectedSessionId]);

    const handleSelectConversation = (sessionId: string) => {
        setSelectedSessionId(sessionId);
        setShowMobileList(false);
        setTimeout(() => inputRef.current?.focus(), 150);
    };

    const handleSendReply = async (textToSend?: string) => {
        const message = (textToSend || replyText).trim();
        if (!message || !selectedSessionId) return;

        setReplyText('');
        try {
            await replyMutation({ sessionId: selectedSessionId, text: message }).unwrap();
            refetchActive();
            refetchList();
            setTimeout(() => inputRef.current?.focus(), 100);
        } catch (err: any) {
            toast.error(err?.data?.message || 'Failed to send reply');
        }
    };

    const handleStatusChange = async (newStatus: 'active' | 'resolved' | 'archived') => {
        if (!selectedSessionId) return;
        try {
            await updateStatusMutation({ sessionId: selectedSessionId, status: newStatus }).unwrap();
            toast.success(`Chat marked as ${newStatus}`);
            refetchActive();
            refetchList();
        } catch {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (sessionId: string) => {
        if (!window.confirm('Delete this entire chat conversation?')) return;
        try {
            await deleteMutation(sessionId).unwrap();
            toast.success('Conversation deleted');
            if (selectedSessionId === sessionId) {
                const remaining = conversations.filter((c: any) => c.sessionId !== sessionId);
                setSelectedSessionId(remaining[0]?.sessionId || null);
            }
            refetchList();
        } catch {
            toast.error('Failed to delete conversation');
        }
    };

    const copySessionId = (id: string) => {
        navigator.clipboard.writeText(id);
        toast.success('Session ID copied to clipboard');
    };

    const formatTime = (dateStr?: string | Date) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;

        const isToday = d.toDateString() === now.toDateString();
        if (isToday) {
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-4 max-w-[1600px] mx-auto">
            {/* Top Stat Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[var(--color-primary)] shadow-xs">
                        <LuMessageSquare size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-slate-900">Live Customer Support</h1>
                            {stats.unread > 0 && (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white animate-pulse">
                                    {stats.unread} Unread
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Manage visitor queries, AI assistant interactions, and send instant live support replies
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => { refetchList(); if (selectedSessionId) refetchActive(); }}
                        className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 flex items-center gap-2 transition-colors text-slate-700 bg-white shadow-2xs"
                    >
                        <LuRefreshCw size={13} /> Refresh Chats
                    </button>
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <LuMessageSquare size={20} />
                    </div>
                    <div>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Total Chats</p>
                        <p className="text-2xl font-black text-slate-800">{stats.total || 0}</p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                        <LuClock size={20} />
                    </div>
                    <div>
                        <p className="text-[11px] text-red-500 font-bold uppercase tracking-wider">Unread Messages</p>
                        <p className="text-2xl font-black text-red-600">{stats.unread || 0}</p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <LuSparkles size={20} />
                    </div>
                    <div>
                        <p className="text-[11px] text-emerald-600 font-bold uppercase tracking-wider">Active Threads</p>
                        <p className="text-2xl font-black text-emerald-700">{stats.active || 0}</p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                        <LuCircleCheck size={20} />
                    </div>
                    <div>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Resolved</p>
                        <p className="text-2xl font-black text-slate-800">{stats.resolved || 0}</p>
                    </div>
                </div>
            </div>

            {/* Main Live Support Workspace */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex h-[680px] relative">
                
                {/* ── Left Column: Conversation Sidebar (Always Visible on Desktop) ── */}
                <div className={`w-full md:w-[350px] lg:w-[380px] shrink-0 border-r border-slate-200 flex flex-col bg-slate-50/60 z-20 ${showMobileList ? 'flex' : 'hidden md:flex'}`}>
                    
                    {/* Search & Tabs Header */}
                    <div className="p-3.5 border-b border-slate-200 bg-white space-y-2.5">
                        <div className="relative">
                            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                            <input
                                type="text"
                                placeholder="Search customer, phone, text..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-slate-100/80 border border-transparent focus:border-[var(--color-primary)] focus:bg-white rounded-xl text-xs outline-none transition-all placeholder:text-slate-400"
                            />
                        </div>

                        {/* Status Filter Tabs */}
                        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl text-[11px] font-semibold">
                            {[
                                { id: 'all', label: `All (${stats.total || 0})` },
                                { id: 'unread', label: `Unread (${stats.unread || 0})` },
                                { id: 'active', label: 'Active' },
                                { id: 'resolved', label: 'Resolved' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setStatusFilter(tab.id)}
                                    className={`py-1.5 rounded-lg transition-all text-center truncate ${statusFilter === tab.id ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Conversations List */}
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                        {loadingList ? (
                            <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                                <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                                <span>Loading live conversations...</span>
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="p-12 text-center space-y-2">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                                    <LuMessageSquare size={24} />
                                </div>
                                <p className="text-xs font-bold text-slate-700">No conversations found</p>
                                <p className="text-[11px] text-slate-400">Incoming visitor messages will appear here live</p>
                            </div>
                        ) : (
                            conversations.map((c: any) => {
                                const isSelected = selectedSessionId === c.sessionId;
                                const hasUnread = c.unreadAdminCount > 0;
                                const displayName = c.customerName || (c.user?.name) || 'Visitor';
                                const isGuest = !c.user;
                                const lastSender = c.lastMessageSender;

                                return (
                                    <div
                                        key={c.sessionId}
                                        onClick={() => handleSelectConversation(c.sessionId)}
                                        className={`p-3.5 cursor-pointer transition-all relative flex items-start gap-3 hover:bg-white ${isSelected ? 'bg-white border-l-4 border-l-[var(--color-primary)] shadow-sm' : ''}`}
                                    >
                                        {/* Avatar & Badges */}
                                        <div className="relative shrink-0 mt-0.5">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black text-white shadow-2xs ${isGuest ? 'bg-gradient-to-tr from-slate-600 to-slate-500' : 'bg-gradient-to-tr from-[var(--color-primary)] to-indigo-600'}`}>
                                                {displayName[0]?.toUpperCase() || 'V'}
                                            </div>
                                            {hasUnread && (
                                                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white ring-1 ring-red-400 animate-pulse" />
                                            )}
                                        </div>

                                        {/* Text Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1.5">
                                                <p className={`text-xs truncate ${hasUnread ? 'font-black text-slate-900' : 'font-bold text-slate-800'}`}>
                                                    {displayName}
                                                </p>
                                                <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                                                    {formatTime(c.lastMessageAt)}
                                                </span>
                                            </div>

                                            {/* Subtitle Details */}
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <span className={`text-[9.5px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${isGuest ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                                                    {isGuest ? 'Guest' : 'Member'}
                                                </span>
                                                {c.status === 'resolved' && (
                                                    <span className="text-[9.5px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                                                        Resolved
                                                    </span>
                                                )}
                                                {hasUnread && (
                                                    <span className="text-[9.5px] px-2 py-0.5 rounded-md bg-red-100 text-red-700 font-black ml-auto">
                                                        {c.unreadAdminCount} new
                                                    </span>
                                                )}
                                            </div>

                                            {/* Message Snippet */}
                                            <p className={`text-[12px] truncate mt-1.5 flex items-center gap-1 ${hasUnread ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                                                {lastSender === 'admin' && <span className="text-[10px] text-[var(--color-primary)] font-bold shrink-0">You:</span>}
                                                {lastSender === 'bot' && <span className="text-[10px] text-slate-400 font-semibold shrink-0">Bot:</span>}
                                                <span className="truncate">{c.lastMessage || 'Started conversation'}</span>
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ── Right Column: Active Conversation Workspace ── */}
                <div className={`flex-1 flex flex-col bg-white overflow-hidden ${!showMobileList ? 'flex' : 'hidden md:flex'}`}>
                    {activeSession ? (
                        <>
                            {/* Conversation Top Header */}
                            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0 shadow-2xs">
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <button
                                        onClick={() => setShowMobileList(true)}
                                        className="md:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600 border border-slate-200"
                                        title="Back to list"
                                    >
                                        <LuArrowLeft size={16} />
                                    </button>

                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--color-primary)] to-indigo-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
                                        {(activeSession.customerName || activeSession.user?.name || 'V')[0]?.toUpperCase()}
                                    </div>

                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-sm font-black text-slate-900 truncate">
                                                {activeSession.customerName || activeSession.user?.name || 'Visitor'}
                                            </h3>
                                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${activeSession.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                                                {activeSession.status}
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                                                {activeSession.user ? 'Registered Account' : 'Guest Visitor'}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 text-[11px] text-slate-500 truncate mt-0.5 flex-wrap">
                                            {activeSession.customerPhone && (
                                                <a href={`tel:${activeSession.customerPhone}`} className="flex items-center gap-1 hover:text-[var(--color-primary)]">
                                                    <LuPhone size={11} /> {activeSession.customerPhone}
                                                </a>
                                            )}
                                            {activeSession.customerEmail && (
                                                <a href={`mailto:${activeSession.customerEmail}`} className="flex items-center gap-1 hover:text-[var(--color-primary)]">
                                                    <LuMail size={11} /> {activeSession.customerEmail}
                                                </a>
                                            )}
                                            <button
                                                onClick={() => copySessionId(activeSession.sessionId)}
                                                className="flex items-center gap-1 text-slate-400 hover:text-slate-700"
                                                title="Click to copy Session ID"
                                            >
                                                <LuCopy size={11} /> <span className="font-mono">{activeSession.sessionId.substring(0, 16)}...</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Header Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {activeSession.customerPhone && (
                                        <a
                                            href={`https://wa.me/${activeSession.customerPhone.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-emerald-200"
                                            title="Open in WhatsApp"
                                        >
                                            <FaWhatsapp size={13} /> WhatsApp
                                        </a>
                                    )}

                                    {activeSession.status !== 'resolved' ? (
                                        <button
                                            onClick={() => handleStatusChange('resolved')}
                                            className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
                                        >
                                            <LuCheck size={14} /> Mark Resolved
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleStatusChange('active')}
                                            className="px-3 py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-amber-200"
                                        >
                                            <LuClock size={14} /> Reopen Chat
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleDelete(activeSession.sessionId)}
                                        title="Delete Chat"
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-200"
                                    >
                                        <LuTrash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Thread Message History */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
                                {activeSession.messages?.map((m: any, idx: number) => {
                                    const isUser = m.sender === 'user';
                                    const isBot = m.sender === 'bot';
                                    const isAdmin = m.sender === 'admin';

                                    return (
                                        <div
                                            key={idx}
                                            className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className="max-w-[78%]">
                                                {/* Sender Header */}
                                                <div className={`flex items-center gap-1.5 mb-1.5 text-[11px] font-bold ${isAdmin ? 'justify-end text-[var(--color-primary)]' : isBot ? 'text-slate-500' : 'text-slate-700'}`}>
                                                    {isAdmin && (
                                                        <>
                                                            <LuHeadphones size={12} />
                                                            <span>{m.senderName || 'You (Support)'}</span>
                                                            <span className="text-[9.5px] bg-[var(--color-primary)]/10 px-1.5 py-0.2 rounded font-bold">Staff</span>
                                                        </>
                                                    )}
                                                    {isBot && (
                                                        <>
                                                            <FaRobot size={12} className="text-indigo-500" />
                                                            <span>AI Assistant</span>
                                                        </>
                                                    )}
                                                    {isUser && (
                                                        <>
                                                            <LuUser size={12} className="text-slate-500" />
                                                            <span>{activeSession.customerName || 'Customer'}</span>
                                                        </>
                                                    )}
                                                    <span className="text-[10px] text-slate-400 font-normal ml-1">
                                                        · {formatTime(m.createdAt)}
                                                    </span>
                                                </div>

                                                {/* Chat Bubble */}
                                                <div
                                                    className={`text-[13.5px] leading-relaxed whitespace-pre-line px-4 py-3 shadow-xs ${
                                                        isAdmin
                                                            ? 'bg-[var(--color-primary)] text-white rounded-2xl rounded-tr-xs font-medium'
                                                            : isBot
                                                            ? 'bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-xs'
                                                            : 'bg-white border border-slate-200/90 text-slate-900 rounded-2xl rounded-tl-xs font-medium'
                                                    }`}
                                                >
                                                    {m.text}
                                                </div>

                                                {/* Bot Quick Actions display */}
                                                {m.actions && m.actions.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                                        {m.actions.map((a: any, j: number) => (
                                                            <span key={j} className="text-[11px] bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-full font-medium shadow-2xs">
                                                                {a.label}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Delivery Status Indicator for Admin messages */}
                                                {isAdmin && (
                                                    <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400">
                                                        <LuCheckCheck size={12} className="text-[var(--color-primary)]" /> Delivered
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Canned Quick Replies Chips */}
                            <div className="px-4 py-2 border-t border-slate-100 bg-white flex gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider self-center shrink-0 mr-1">
                                    Quick Replies:
                                </span>
                                {QUICK_REPLIES.map((qr, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSendReply(qr)}
                                        className="text-[11px] whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-100 hover:bg-[var(--color-primary)] hover:text-white text-slate-700 font-medium transition-all shadow-2xs shrink-0 active:scale-95"
                                    >
                                        {qr}
                                    </button>
                                ))}
                            </div>

                            {/* Reply Input Composer */}
                            <div className="p-3.5 border-t border-slate-200 bg-white shrink-0">
                                <form
                                    onSubmit={(e) => { e.preventDefault(); handleSendReply(); }}
                                    className="flex items-center gap-2.5"
                                >
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        placeholder={`Reply to ${activeSession.customerName || 'customer'} (Press Enter to send)...`}
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 focus:border-[var(--color-primary)] focus:bg-white rounded-xl text-xs outline-none transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!replyText.trim() || isSending}
                                        className="px-5 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-40 cursor-pointer shadow-md shrink-0"
                                    >
                                        <LuSend size={14} /> Send Reply
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/40">
                            <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-300 mb-4">
                                <LuMessageSquare size={36} />
                            </div>
                            <h3 className="text-base font-bold text-slate-800">Select a Conversation</h3>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                                Pick a customer or guest from the left sidebar to view their message history and reply directly.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminChatPage;
