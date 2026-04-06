import { Router } from 'express';
import {
  createRecord,
  listRecords,
  getRecord,
  updateRecord,
  deleteRecord,
} from '../controllers/record.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

// All record routes require a valid token
router.use(requireAuth);

// Read access: analyst and admin only (viewers are dashboard-only)
router.get('/', requireRole('admin', 'analyst'), listRecords);
router.get('/:id', requireRole('admin', 'analyst'), getRecord);

// Write access: admin only
router.post('/', requireRole('admin'), createRecord);
router.patch('/:id', requireRole('admin'), updateRecord);
router.delete('/:id', requireRole('admin'), deleteRecord);

export default router;
