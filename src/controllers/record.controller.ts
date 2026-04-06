import { Request, Response } from 'express';
import FinancialRecord from '../models/FinancialRecord';
import { sendSuccess, sendError } from '../utils/response';
import {
  createRecordSchema,
  updateRecordSchema,
  recordQuerySchema,
} from '../validators/record.validator';
import catchAsync from '../utils/catchAsync';

export const createRecord = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const parsed = createRecordSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, parsed.error.errors[0].message, 422);
    return;
  }

  const record = await FinancialRecord.create({
    ...parsed.data,
    createdBy: req.user!._id,
  });

  sendSuccess(res, { record }, 201);
});

export const listRecords = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const parsed = recordQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendError(res, parsed.error.errors[0].message, 422);
    return;
  }

  const { type, category, from, to, page, limit } = parsed.data;

  // base filter — always exclude soft-deleted records
  const filter: Record<string, unknown> = { deletedAt: null };

  if (type) filter.type = type;
  if (category) filter.category = { $regex: category, $options: 'i' };
  if (from || to) {
    filter.date = {};
    if (from) (filter.date as Record<string, Date>).$gte = from;
    if (to) (filter.date as Record<string, Date>).$lte = to;
  }

  const skip = (page - 1) * limit;
  const [records, total] = await Promise.all([
    FinancialRecord.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email'),
    FinancialRecord.countDocuments(filter),
  ]);

  sendSuccess(res, {
    records,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
});

export const getRecord = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const record = await FinancialRecord.findOne({
    _id: req.params.id,
    deletedAt: null,
  }).populate('createdBy', 'name email');

  if (!record) {
    sendError(res, 'Record not found', 404);
    return;
  }

  sendSuccess(res, { record });
});

export const updateRecord = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const parsed = updateRecordSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, parsed.error.errors[0].message, 422);
    return;
  }

  const record = await FinancialRecord.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    parsed.data,
    { new: true, runValidators: true }
  ).populate('createdBy', 'name email');

  if (!record) {
    sendError(res, 'Record not found', 404);
    return;
  }

  sendSuccess(res, { record });
});

export const deleteRecord = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const record = await FinancialRecord.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    { deletedAt: new Date() },
    { new: true }
  );

  if (!record) {
    sendError(res, 'Record not found', 404);
    return;
  }

  sendSuccess(res, { message: 'Record deleted successfully' });
});
