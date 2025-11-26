/**
 * Admin Routes
 * Admin-only routes for managing plans, features, and qualifications
 */

import { Router } from 'express';
import { requireAdmin } from '../../middlewares/role.middleware';
import plansRouter from './plans.routes';
import featuresRouter from './features.routes';
import qualificationsRouter from './qualifications.routes';
import modulesRouter from './modules.routes';

const router = Router();

// All admin routes require admin role
router.use(requireAdmin);

// Mount admin sub-routes
router.use('/plans', plansRouter);
router.use('/features', featuresRouter);
router.use('/qualifications', qualificationsRouter);
router.use('/modules', modulesRouter);

export default router;

