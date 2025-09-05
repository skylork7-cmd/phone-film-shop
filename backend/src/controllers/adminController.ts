import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { User } from '../types';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];

    res.json(users);
  } catch (error) {
    console.error('사용자 목록 조회 실패:', error);
    res.status(500).json({ message: '사용자 목록 조회에 실패했습니다.' });
  }
};

export const testConnection = async (req: Request, res: Response) => {
  try {
    // 간단한 연결 테스트
    const testData = {
      test: true,
      timestamp: new Date(),
      message: 'Backend API 연결 테스트'
    };

    const testRef = await db.collection('test').add(testData);
    
    // 테스트 문서 삭제
    await db.collection('test').doc(testRef.id).delete();

    res.json({
      message: 'Backend API 연결이 정상입니다!',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('연결 테스트 실패:', error);
    res.status(500).json({ 
      message: 'Backend API 연결에 실패했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
};
