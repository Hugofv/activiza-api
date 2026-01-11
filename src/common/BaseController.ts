/**
 * Base Controller with response helpers
 * Extend this class to use response methods without passing res parameter
 */

import { Response } from 'express';
import HttpStatusCodes from './HttpStatusCodes';

interface SuccessResponse<T = unknown> {
  success: true;
  [key: string]: any;
}

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

export abstract class BaseController {
  protected res!: Response;

  /**
   * Set the response object (call this in each method)
   */
  protected setResponse(res: Response): void {
    this.res = res;
  }

  /**
   * Send success response (200 OK)
   */
  protected ok<T>(data: T): Response {
    return this.res.status(HttpStatusCodes.OK).json({
      success: true,
      ...data,
    } as SuccessResponse<T>);
  }

  /**
   * Send created response (201 Created)
   */
  protected created<T>(data: T): Response {
    return this.res.status(HttpStatusCodes.CREATED).json({
      success: true,
      ...data,
    } as SuccessResponse<T>);
  }

  /**
   * Send no content response (204 No Content)
   */
  protected noContent(): Response {
    return this.res.status(HttpStatusCodes.NO_CONTENT).json({
      success: true,
    });
  }

  /**
   * Send bad request response (400 Bad Request)
   */
  protected badRequest(
    message: string,
    code = 'BAD_REQUEST',
    details?: unknown
  ): Response {
    return this.res.status(HttpStatusCodes.BAD_REQUEST).json({
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
  protected unauthorized(
    message = 'Authentication required',
    code = 'UNAUTHORIZED'
  ): Response {
    return this.res.status(HttpStatusCodes.UNAUTHORIZED).json({
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
  protected forbidden(
    message = 'Access denied',
    code = 'FORBIDDEN'
  ): Response {
    return this.res.status(HttpStatusCodes.FORBIDDEN).json({
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
  protected notFound(
    message = 'Resource not found',
    code = 'NOT_FOUND'
  ): Response {
    return this.res.status(HttpStatusCodes.NOT_FOUND).json({
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
  protected conflict(
    message: string,
    code = 'CONFLICT'
  ): Response {
    return this.res.status(HttpStatusCodes.CONFLICT).json({
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
  protected unprocessableEntity(
    message: string,
    code = 'VALIDATION_ERROR',
    details?: unknown
  ): Response {
    return this.res.status(HttpStatusCodes.UNPROCESSABLE_ENTITY).json({
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
  protected internalServerError(
    message = 'Internal server error',
    code = 'INTERNAL_ERROR'
  ): Response {
    return this.res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
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
  protected error(
    statusCode: number,
    message: string,
    code: string,
    details?: unknown
  ): Response {
    return this.res.status(statusCode).json({
      success: false,
      error: {
        message,
        code,
        details,
      },
    } as ErrorResponse);
  }
}

