import express from 'express';
import CurriculumPageController from './curriculumPage.controller';
import { authMiddleware, authorizeRoles } from '../../middlewares/auth';

const router = express.Router();

// Public routes
router.get('/', CurriculumPageController.getAllPages);
router.get('/slug/:slug', CurriculumPageController.getPageBySlug);

// Admin routes
router.get('/:id', authMiddleware, authorizeRoles('admin'), CurriculumPageController.getPageById);
router.post('/', authMiddleware, authorizeRoles('admin'), CurriculumPageController.createPage);
router.patch('/:id', authMiddleware, authorizeRoles('admin'), CurriculumPageController.updatePage);
router.delete('/:id', authMiddleware, authorizeRoles('admin'), CurriculumPageController.deletePage);

export const CurriculumPageRoutes = router;
