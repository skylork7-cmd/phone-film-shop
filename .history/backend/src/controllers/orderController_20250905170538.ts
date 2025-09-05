import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { Order } from '../types';

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const ordersSnapshot = await db.collection('orders').get();
    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Order[];

    res.json(orders);
  } catch (error) {
    console.error('주문 목록 조회 실패:', error);
    res.status(500).json({ message: '주문 목록 조회에 실패했습니다.' });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const orderData: Omit<Order, 'id'> = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 필수 필드 검증
    if (!orderData.userId || !orderData.productId || !orderData.quantity) {
      return res.status(400).json({ message: '필수 필드 누락: userId, productId, quantity' });
    }

    // 상품 재고 확인 및 차감
    const productDoc = await db.collection('products').doc(orderData.productId).get();
    if (!productDoc.exists) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    const product = productDoc.data() as { stock?: number } | undefined;
    if (!product || typeof product.stock !== 'number') {
      return res.status(500).json({ message: '상품 데이터가 올바르지 않습니다.' });
    }
    if (product.stock < orderData.quantity) {
      return res.status(400).json({ message: '재고가 부족합니다.' });
    }

    // 재고 차감
    await db.collection('products').doc(orderData.productId).update({
      stock: product.stock - orderData.quantity,
      updatedAt: new Date()
    });

    const docRef = await db.collection('orders').add(orderData);
    
    res.status(201).json({
      id: docRef.id,
      ...orderData
    });
  } catch (error) {
    console.error('주문 생성 실패:', error);
    res.status(500).json({ message: '주문 생성에 실패했습니다.' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    await db.collection('orders').doc(id).update({
      orderStatus,
      updatedAt: new Date()
    });

    res.json({ message: '주문 상태가 업데이트되었습니다.' });
  } catch (error) {
    console.error('주문 상태 업데이트 실패:', error);
    res.status(500).json({ message: '주문 상태 업데이트에 실패했습니다.' });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // 주문 정보 조회
    const orderDoc = await db.collection('orders').doc(id).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    const order = orderDoc.data() as Order;
    
    // 상품 재고 복원
    const productDoc = await db.collection('products').doc(order.productId).get();
    if (productDoc.exists) {
      const product = productDoc.data() as { stock?: number } | undefined;
      if (product && typeof product.stock === 'number') {
        await db.collection('products').doc(order.productId).update({
          stock: product.stock + order.quantity,
          updatedAt: new Date()
        });
      }
    }

    // 주문 삭제
    await db.collection('orders').doc(id).delete();
    
    res.json({ message: '주문이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('주문 삭제 실패:', error);
    res.status(500).json({ message: '주문 삭제에 실패했습니다.' });
  }
};
