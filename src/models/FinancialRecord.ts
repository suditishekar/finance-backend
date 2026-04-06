import mongoose, { Document, Schema } from 'mongoose';

export type RecordType = 'income' | 'expense';

export interface IFinancialRecord extends Document {
  amount: number;
  type: RecordType;
  category: string;
  date: Date;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const financialRecordSchema = new Schema<IFinancialRecord>(
  {
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Type is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // soft delete — records with a deletedAt are treated as deleted
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for common query patterns
financialRecordSchema.index({ createdBy: 1, date: -1 });
financialRecordSchema.index({ type: 1, category: 1 });

const FinancialRecord = mongoose.model<IFinancialRecord>('FinancialRecord', financialRecordSchema);
export default FinancialRecord;
