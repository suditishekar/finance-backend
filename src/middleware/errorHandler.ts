import { Request, Response, NextFunction } from 'express';

interface MongoError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
  path?: string;
  value?: unknown;
}

export const errorHandler = (
  err: MongoError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(err);

  // Invalid MongoDB ObjectId (e.g. /api/records/not-an-id)
  if (err.name === 'CastError') {
    res.status(400).json({ success: false, message: 'Invalid ID format' });
    return;
  }

  // Duplicate unique field (e.g. email already registered)
  if (err.code === 11000 && err.keyValue) {
    const field = Object.keys(err.keyValue)[0];
    res.status(409).json({ success: false, message: `${field} is already in use` });
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    res.status(422).json({ success: false, message: err.message });
    return;
  }

  // JWT errors are handled in the middleware, but catch any that slip through
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
    return;
  }

  res.status(500).json({ success: false, message: 'Something went wrong on our end' });
};

