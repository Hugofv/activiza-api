/**
 * Setup express server.
 */

import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import express, { Request, Response, NextFunction } from 'express';
import logger from 'jet-logger';
import cors from 'cors';

import 'express-async-errors';

import { loadContainer } from './container';
import routes from './routes';
import { NodeEnvs } from './common/misc';
import { errorMiddleware } from './middlewares/error.middleware';
import authRouter from './routes/auth.routes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

// **** Variables **** //

const app = express();

// **** Setup **** //

// Basic middleware
app.use(
  cors({
    origin: '*',
    methods: '*',
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser(EnvVars.CookieProps.Secret));

// Show routes called in console during development
if (process.env.NODE_ENV === NodeEnvs.Dev.valueOf()) {
  app.use(morgan('dev'));
}

// Security
if (process.env.NODE_ENV === NodeEnvs.Production.valueOf()) {
  app.use(helmet());
}

// Swagger/OpenAPI Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Operations Management API - Documentation',
}));

// Add APIs, must be after middleware
loadContainer(app);

// Public routes (no authentication required)
app.use('/', authRouter);

// Protected routes (all /api/* require authentication)
app.use('/api', routes);

// Add error handler
app.use(errorMiddleware);

// **** Export default **** //

export default app;
