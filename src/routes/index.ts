import { Router } from 'express';
import accountsRouter from './accounts.routes';
import clientsRouter from './clients.routes';
import operationsRouter from './operations.routes';
import installmentsRouter from './installments.routes';
import paymentsRouter from './payments.routes';
import resourcesRouter from './resources.routes';
import alertsRouter from './alerts.routes';
import notificationsRouter from './notifications.routes';
import settingsRouter from './settings.routes';
import platformUsersRouter from './platformUsers.routes';
import onboardingRouter from './onboarding.routes';
import plansRouter from './plans.routes';
import adminRouter from './admin';
import { authMiddleware } from '../middlewares/auth.middleware';

const routes = Router();

// Public routes (no authentication required)
routes.use('/plans', plansRouter);

// All other /api/* routes require authentication
routes.use(authMiddleware);

// Protected routes (require authentication)
routes.use('/onboarding', onboardingRouter); // Now protected - requires token
routes.use('/accounts', accountsRouter);
routes.use('/clients', clientsRouter);
routes.use('/operations', operationsRouter);
routes.use('/installments', installmentsRouter);
routes.use('/payments', paymentsRouter);
routes.use('/resources', resourcesRouter);
routes.use('/alerts', alertsRouter);
routes.use('/notifications', notificationsRouter);
routes.use('/settings', settingsRouter);
routes.use('/platform-users', platformUsersRouter);
routes.use('/admin', adminRouter);

export default routes;
