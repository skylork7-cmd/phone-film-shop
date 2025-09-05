import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import adminRoutes from './routes/adminRoutes';

// 환경 변수 로드
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// 미들웨어 설정
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 헬스 체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API 라우트
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({ message: 'API 엔드포인트를 찾을 수 없습니다.' });
});

// 에러 핸들러
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('서버 에러:', err);
  res.status(500).json({ 
    message: '서버 내부 오류가 발생했습니다.',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 Backend server is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
});

export default app;
