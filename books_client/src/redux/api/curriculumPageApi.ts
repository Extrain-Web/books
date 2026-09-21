import { baseApi } from './baseApi';

export const curriculumPageApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Public: get all curriculum pages
        getCurriculumPages: builder.query({
            query: (params?: Record<string, string>) => ({
                url: '/curriculum-pages',
                params,
            }),
            providesTags: ['CurriculumPages'],
        }),

        // Public: get single page by slug
        getCurriculumPageBySlug: builder.query({
            query: (slug: string) => `/curriculum-pages/slug/${slug}`,
            providesTags: ['CurriculumPages'],
        }),

        // Admin: get by ID
        getCurriculumPageById: builder.query({
            query: (id: string) => `/curriculum-pages/${id}`,
            providesTags: ['CurriculumPages'],
        }),

        // Admin: create
        createCurriculumPage: builder.mutation({
            query: (body) => ({
                url: '/curriculum-pages',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['CurriculumPages'],
        }),

        // Admin: update
        updateCurriculumPage: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/curriculum-pages/${id}`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['CurriculumPages'],
        }),

        // Admin: delete
        deleteCurriculumPage: builder.mutation({
            query: (id: string) => ({
                url: `/curriculum-pages/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['CurriculumPages'],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetCurriculumPagesQuery,
    useGetCurriculumPageBySlugQuery,
    useGetCurriculumPageByIdQuery,
    useCreateCurriculumPageMutation,
    useUpdateCurriculumPageMutation,
    useDeleteCurriculumPageMutation,
} = curriculumPageApi;
