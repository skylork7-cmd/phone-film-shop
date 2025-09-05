import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { auth } from '../config/firebase';

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: '액세스 토큰이 필요합니다.' });
    }

    // Firebase Admin SDK로 토큰 검증
    const decodedToken = await auth.verifyIdToken(token);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      isAdmin: decodedToken.email === 'admin@gmail.com'
    };

    next();
  } catch (error) {
    console.error('토큰 검증 실패:', error);
    return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: '관리자 권한이 필요합니다.' });
  }
  next();
};
