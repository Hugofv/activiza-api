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
import EnvVars from './common/EnvVars';

// **** Variables **** //

const app = express();

// **** Setup **** //

// Basic middleware
// CORS configuration - must allow specific origins when credentials are included
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, etc.) in development
      if (!origin && EnvVars.NodeEnv === NodeEnvs.Dev.valueOf()) {
        return callback(null, true);
      }
      
      // Check if origin is in allowed list
      if (origin && EnvVars.Cors.Origins.includes(origin)) {
        return callback(null, true);
      }
      
      // Reject origin not in allowed list
      if (EnvVars.NodeEnv === NodeEnvs.Dev.valueOf()) {
        logger.warn(`CORS: Blocked request from origin: ${origin || 'unknown'}`);
      }
      callback(null, false);
    },
    credentials: true, // Allow credentials (cookies, authorization headers)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Authorization'],
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
app.use('/auth', authRouter);

// Protected routes (all /api/* require authentication)
app.use('/api', routes);

// Add error handler
app.use(errorMiddleware);

// **** Export default **** //

export default app;
