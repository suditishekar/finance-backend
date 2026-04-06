import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import User, { UserRole } from '../models/User';
import { sendError } from '../utils/response';

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Authentication required', 401);
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.id);

    if (!user) {
      sendError(res, 'User no longer exists', 401);
      return;
    }

    if (user.status === 'inactive') {
      sendError(res, 'Your account has been deactivated', 403);
      return;
    }

    req.user = user;
    next();
  } catch {
    sendError(res, 'Invalid or expired token', 401);
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      sendError(res, 'You do not have permission to perform this action', 403);
      return;
    }
    next();
  };
};
