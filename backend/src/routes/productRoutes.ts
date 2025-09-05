import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// 공개 라우트
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// 관리자 전용 라우트
router.post('/', authenticateToken, requireAdmin, createProduct);
router.put('/:id', authenticateToken, requireAdmin, updateProduct);
router.delete('/:id', authenticateToken, requireAdmin, deleteProduct);

export default router;
