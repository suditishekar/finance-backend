import { Router } from 'express';
import {
  getSummary,
  getByCategory,
  getMonthlyTrends,
  getRecentActivity,
} from '../controllers/dashboard.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// All roles can access the dashboard
router.use(requireAuth);

router.get('/summary', getSummary);
router.get('/by-category', getByCategory);
router.get('/trends', getMonthlyTrends);
router.get('/recent', getRecentActivity);

export default router;
