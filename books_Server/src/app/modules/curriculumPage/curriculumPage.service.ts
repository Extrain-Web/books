import { CurriculumPage } from './curriculumPage.model';
import AppError from '../../utils/AppError';

/* ── Public ── */

const getAllPages = async (query: Record<string, unknown> = {}) => {
    const filter: Record<string, unknown> = {};
    if (query.active !== undefined) filter.active = query.active === 'true' || query.active === true;
    const pages = await CurriculumPage.find(filter).sort({ order: 1, createdAt: -1 });
    return pages;
};

const getPageBySlug = async (slug: string) => {
    const page = await CurriculumPage.findOne({ slug, active: true });
    if (!page) throw new AppError(404, 'Curriculum page not found');
    return page;
};

/* ── Admin ── */

const getPageById = async (id: string) => {
    const page = await CurriculumPage.findById(id);
    if (!page) throw new AppError(404, 'Curriculum page not found');
    return page;
};

const createPage = async (data: Record<string, unknown>) => {
    // Auto-generate slug if not provided
    if (!data.slug && typeof data.title === 'string') {
        data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    const page = await CurriculumPage.create(data);
    return page;
};

const updatePage = async (id: string, data: Record<string, unknown>) => {
    const page = await CurriculumPage.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
    });
    if (!page) throw new AppError(404, 'Curriculum page not found');
    return page;
};

const deletePage = async (id: string) => {
    const page = await CurriculumPage.findByIdAndDelete(id);
    if (!page) throw new AppError(404, 'Curriculum page not found');
    return page;
};

const CurriculumPageService = {
    getAllPages,
    getPageBySlug,
    getPageById,
    createPage,
    updatePage,
    deletePage,
};

export default CurriculumPageService;
