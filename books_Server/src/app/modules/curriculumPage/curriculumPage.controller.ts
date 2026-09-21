import { Request, Response, NextFunction } from 'express';
import CurriculumPageService from './curriculumPage.service';

/* ── Public ── */

const getAllPages = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const pages = await CurriculumPageService.getAllPages(req.query as Record<string, unknown>);
        res.json({ success: true, data: pages });
    } catch (err) {
        next(err);
    }
};

const getPageBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = await CurriculumPageService.getPageBySlug(req.params.slug);
        res.json({ success: true, data: page });
    } catch (err) {
        next(err);
    }
};

/* ── Admin ── */

const getPageById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = await CurriculumPageService.getPageById(req.params.id);
        res.json({ success: true, data: page });
    } catch (err) {
        next(err);
    }
};

const createPage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = await CurriculumPageService.createPage(req.body);
        res.status(201).json({ success: true, message: 'Curriculum page created', data: page });
    } catch (err) {
        next(err);
    }
};

const updatePage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = await CurriculumPageService.updatePage(req.params.id, req.body);
        res.json({ success: true, message: 'Curriculum page updated', data: page });
    } catch (err) {
        next(err);
    }
};

const deletePage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await CurriculumPageService.deletePage(req.params.id);
        res.json({ success: true, message: 'Curriculum page deleted' });
    } catch (err) {
        next(err);
    }
};

const CurriculumPageController = {
    getAllPages,
    getPageBySlug,
    getPageById,
    createPage,
    updatePage,
    deletePage,
};

export default CurriculumPageController;
