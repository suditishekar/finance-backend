import { z } from 'zod';

export const createRecordSchema = z.object({
  amount: z.number({ required_error: 'Amount is required' }).positive('Amount must be greater than 0'),
  type: z.enum(['income', 'expense'], { required_error: 'Type must be income or expense' }),
  category: z.string().min(1, 'Category is required').trim(),
  date: z.coerce.date({ invalid_type_error: 'Invalid date format' }),
  notes: z.string().trim().optional(),
});

export const updateRecordSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0').optional(),
  type: z.enum(['income', 'expense']).optional(),
  category: z.string().min(1).trim().optional(),
  date: z.coerce.date().optional(),
  notes: z.string().trim().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

export const recordQuerySchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  category: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
