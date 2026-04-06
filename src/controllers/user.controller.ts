import { Request, Response } from 'express';
import User from '../models/User';
import { sendSuccess, sendError } from '../utils/response';
import { updateUserSchema } from '../validators/user.validator';
import catchAsync from '../utils/catchAsync';

export const listUsers = catchAsync(async (_req: Request, res: Response): Promise<void> => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  sendSuccess(res, { users });
});

export const getUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }
  sendSuccess(res, { user });
});

export const updateUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, parsed.error.errors[0].message, 422);
    return;
  }

  // prevent an admin from demoting themselves
  if (req.params.id === String(req.user!._id)) {
    sendError(res, 'You cannot modify your own account through this endpoint', 403);
    return;
  }

  const user = await User.findByIdAndUpdate(req.params.id, parsed.data, {
    new: true,
    runValidators: true,
  }).select('-password');

  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }

  sendSuccess(res, { user });
});

export const deleteUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (req.params.id === String(req.user!._id)) {
    sendError(res, 'You cannot deactivate your own account', 403);
    return;
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status: 'inactive' },
    { new: true }
  ).select('-password');

  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }

  sendSuccess(res, { message: 'User deactivated successfully', user });
});
