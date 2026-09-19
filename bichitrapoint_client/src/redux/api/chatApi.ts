import { baseApi } from './baseApi';

export const chatApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // ── Public / Customer ──────────────────────────────────────────────
        sendChatMessage: builder.mutation({
            query: (data) => ({
                url: '/chat/send',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Chat'],
        }),
        getChatSession: builder.query({
            query: (arg: string | { sessionId: string; markRead?: boolean }) => {
                const sessionId = typeof arg === 'string' ? arg : arg.sessionId;
                const markRead = typeof arg === 'object' && arg.markRead;
                return {
                    url: `/chat/session/${sessionId}`,
                    params: markRead ? { markRead: 'true' } : undefined,
                };
            },
            providesTags: ['Chat'],
        }),

        // ── Admin Live Chat ────────────────────────────────────────────────
        getAdminConversations: builder.query({
            query: (params) => ({
                url: '/chat/conversations',
                params,
            }),
            providesTags: ['Chat'],
        }),
        getAdminConversation: builder.query({
            query: (sessionId: string) => `/chat/conversations/${sessionId}`,
            providesTags: ['Chat'],
        }),
        replyChatMessage: builder.mutation({
            query: ({ sessionId, text }) => ({
                url: `/chat/conversations/${sessionId}/reply`,
                method: 'POST',
                body: { text },
            }),
            invalidatesTags: ['Chat'],
        }),
        updateChatStatus: builder.mutation({
            query: ({ sessionId, status }) => ({
                url: `/chat/conversations/${sessionId}/status`,
                method: 'PATCH',
                body: { status },
            }),
            invalidatesTags: ['Chat'],
        }),
        deleteChatSession: builder.mutation({
            query: (sessionId: string) => ({
                url: `/chat/conversations/${sessionId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Chat'],
        }),
    }),
});

export const {
    useSendChatMessageMutation,
    useGetChatSessionQuery,
    useGetAdminConversationsQuery,
    useGetAdminConversationQuery,
    useReplyChatMessageMutation,
    useUpdateChatStatusMutation,
    useDeleteChatSessionMutation,
} = chatApi;
