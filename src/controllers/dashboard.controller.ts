import { Request, Response } from 'express';
import FinancialRecord from '../models/FinancialRecord';
import { sendSuccess } from '../utils/response';
import catchAsync from '../utils/catchAsync';

// Shared base filter — excludes soft-deleted records
const activeRecords = { deletedAt: null };

export const getSummary = catchAsync(async (_req: Request, res: Response): Promise<void> => {
  const result = await FinancialRecord.aggregate([
    { $match: activeRecords },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  let totalIncome = 0;
  let totalExpenses = 0;
  let incomeCount = 0;
  let expenseCount = 0;

  for (const row of result) {
    if (row._id === 'income') {
      totalIncome = row.total;
      incomeCount = row.count;
    } else if (row._id === 'expense') {
      totalExpenses = row.total;
      expenseCount = row.count;
    }
  }

  sendSuccess(res, {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    incomeCount,
    expenseCount,
    totalRecords: incomeCount + expenseCount,
  });
});

export const getByCategory = catchAsync(async (_req: Request, res: Response): Promise<void> => {
  const result = await FinancialRecord.aggregate([
    { $match: activeRecords },
    {
      $group: {
        _id: { type: '$type', category: '$category' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
    {
      $group: {
        _id: '$_id.type',
        categories: {
          $push: {
            category: '$_id.category',
            total: '$total',
            count: '$count',
          },
        },
      },
    },
  ]);

  // shape into { income: [...], expense: [...] }
  const byCategory: Record<string, unknown[]> = { income: [], expense: [] };
  for (const row of result) {
    byCategory[row._id] = row.categories;
  }

  sendSuccess(res, { byCategory });
});

export const getMonthlyTrends = catchAsync(async (req: Request, res: Response): Promise<void> => {
  // default: last 6 months
  const months = Math.min(parseInt(req.query.months as string) || 6, 24);
  const since = new Date();
  since.setMonth(since.getMonth() - months);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const result = await FinancialRecord.aggregate([
    { $match: { ...activeRecords, date: { $gte: since } } },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          type: '$type',
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // reshape into array of { year, month, income, expense }
  const map = new Map<string, Record<string, number>>();
  for (const row of result) {
    const key = `${row._id.year}-${String(row._id.month).padStart(2, '0')}`;
    if (!map.has(key)) map.set(key, { year: row._id.year, month: row._id.month, income: 0, expense: 0 });
    map.get(key)![row._id.type] = row.total;
  }

  const trends = Array.from(map.values()).map(m => ({
    ...m,
    net: (m.income ?? 0) - (m.expense ?? 0),
  }));

  sendSuccess(res, { months, trends });
});

export const getRecentActivity = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

  const records = await FinancialRecord.find(activeRecords)
    .sort({ date: -1 })
    .limit(limit)
    .populate('createdBy', 'name');

  sendSuccess(res, { records });
});
