/**
 * Response helpers for consistent API responses
 */

import { Response } from 'express';
import HttpStatusCodes from '../common/HttpStatusCodes';

interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
}

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

/**
 * Send success response (200 OK)
 */
export function ok<T>(res: Response, data: T): Response {
  return res.status(HttpStatusCodes.OK).json({
    success: true,
    data,
  } as SuccessResponse<T>);
}

/**
 * Send created response (201 Created)
 */
export function created<T>(res: Response, data: T): Response {
  return res.status(HttpStatusCodes.CREATED).json({
    success: true,
    data,
  } as SuccessResponse<T>);
}

/**
 * Send no content response (204 No Content)
 */
export function noContent(res: Response): Response {
  return res.status(HttpStatusCodes.NO_CONTENT).json({
    success: true,
  });
}

/**
 * Send bad request response (400 Bad Request)
 */
export function badRequest(
  res: Response,
  message: string,
  code = 'BAD_REQUEST',
  details?: unknown
): Response {
  return res.status(HttpStatusCodes.BAD_REQUEST).json({
    success: false,
    error: {
      message,
      code,
      details,
    },
  } as ErrorResponse);
}

/**
 * Send unauthorized response (401 Unauthorized)
 */
export function unauthorized(
  res: Response,
  message = 'Authentication required',
  code = 'UNAUTHORIZED'
): Response {
  return res.status(HttpStatusCodes.UNAUTHORIZED).json({
    success: false,
    error: {
      message,
      code,
    },
  } as ErrorResponse);
}

/**
 * Send forbidden response (403 Forbidden)
 */
export function forbidden(
  res: Response,
  message = 'Access denied',
  code = 'FORBIDDEN'
): Response {
  return res.status(HttpStatusCodes.FORBIDDEN).json({
    success: false,
    error: {
      message,
      code,
    },
  } as ErrorResponse);
}

/**
 * Send not found response (404 Not Found)
 */
export function notFound(
  res: Response,
  message = 'Resource not found',
  code = 'NOT_FOUND'
): Response {
  return res.status(HttpStatusCodes.NOT_FOUND).json({
    success: false,
    error: {
      message,
      code,
    },
  } as ErrorResponse);
}

/**
 * Send conflict response (409 Conflict)
 */
export function conflict(
  res: Response,
  message: string,
  code = 'CONFLICT'
): Response {
  return res.status(HttpStatusCodes.CONFLICT).json({
    success: false,
    error: {
      message,
      code,
    },
  } as ErrorResponse);
}

/**
 * Send unprocessable entity response (422 Unprocessable Entity)
 */
export function unprocessableEntity(
  res: Response,
  message: string,
  code = 'VALIDATION_ERROR',
  details?: unknown
): Response {
  return res.status(HttpStatusCodes.UNPROCESSABLE_ENTITY).json({
    success: false,
    error: {
      message,
      code,
      details,
    },
  } as ErrorResponse);
}

/**
 * Send internal server error response (500 Internal Server Error)
 */
export function internalServerError(
  res: Response,
  message = 'Internal server error',
  code = 'INTERNAL_ERROR'
): Response {
  return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: {
      message,
      code,
    },
  } as ErrorResponse);
}

/**
 * Send custom error response
 */
export function error(
  res: Response,
  statusCode: number,
  message: string,
  code: string,
  details?: unknown
): Response {
  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
      details,
    },
  } as ErrorResponse);
}

