import { Router } from 'express';
import {
  getAllOrders,
  createOrder,
  updateOrderStatus,
  deleteOrder
} from '../controllers/orderController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// 공개 라우트
router.post('/', createOrder);

// 관리자 전용 라우트
router.get('/', authenticateToken, requireAdmin, getAllOrders);
router.put('/:id/status', authenticateToken, requireAdmin, updateOrderStatus);
router.delete('/:id', authenticateToken, requireAdmin, deleteOrder);

export default router;
