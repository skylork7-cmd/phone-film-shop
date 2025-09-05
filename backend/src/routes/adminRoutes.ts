import { Router } from 'express';
import {
  getAllUsers,
  testConnection
} from '../controllers/adminController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// 관리자 전용 라우트
router.get('/users', authenticateToken, requireAdmin, getAllUsers);
router.get('/test', testConnection);

export default router;
