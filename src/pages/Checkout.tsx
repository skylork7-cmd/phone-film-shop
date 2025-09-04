import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../config/firebase';
import { collection, doc, serverTimestamp, runTransaction } from 'firebase/firestore';

export const Checkout: React.FC = () => {
  const { items, totalPrice, clear } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleOrder = async () => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    setIsProcessing(true);
    try {
      // 각 상품에 대해 트랜잭션으로 주문 처리
      for (const { product, quantity } of items) {
        const productRef = doc(db, 'products', product.id);

        await runTransaction(db, async (transaction) => {
          const productDoc = await transaction.get(productRef);

          if (!productDoc.exists()) {
            throw new Error('상품을 찾을 수 없습니다.');
          }

          const currentProductData = productDoc.data();
          const currentStock = currentProductData.stock || 0;
          const initialStock = currentProductData.initialStock || currentStock;
          const remainingStock = currentProductData.remainingStock !== undefined ? currentProductData.remainingStock : currentStock;

          if (remainingStock < quantity) {
            throw new Error(`재고가 부족합니다. ${product.name}: 현재 재고 ${remainingStock}개, 주문 수량 ${quantity}개`);
          }

          const newRemainingStock = remainingStock - quantity;

          // 상품 문서 업데이트 (재고 차감)
          transaction.update(productRef, {
            stock: newRemainingStock,
            initialStock: initialStock,
            remainingStock: newRemainingStock,
            updatedAt: serverTimestamp()
          });

          // 주문 정보 저장
          const orderData = {
            userId: user?.id,
            userEmail: user?.email,
            productId: product.id,
            productName: product.name,
            productPrice: product.price,
            quantity: quantity,
            totalPrice: product.price * quantity,
            orderSource: 'cart',
            orderStatus: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          const orderRef = collection(db, 'orders');
          transaction.set(doc(orderRef), orderData);

          // 상품별 구매 이력 저장
          const purchaseHistoryRef = collection(db, `products/${product.id}/purchases`);
          transaction.set(doc(purchaseHistoryRef), {
            userId: user?.id,
            userEmail: user?.email,
            quantity: quantity,
            totalPrice: product.price * quantity,
            createdAt: serverTimestamp()
          });
        });
      }

      alert('주문이 완료되었습니다! 감사합니다.');
      clear();
      navigate('/');
    } catch (error: any) {
      console.error('주문 처리 실패:', error);
      alert(error?.message || '주문 처리에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <main style={{ maxWidth: 800, margin: '24px auto', padding: '0 16px' }}>
        결제할 상품이 없습니다.
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 800, margin: '24px auto', padding: '0 16px' }}>
      <h1>주문/결제</h1>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
        {items.map(({ product, quantity }) => (
          <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <div>
              {product.name} × {quantity}
            </div>
            <div>{(product.price * quantity).toLocaleString()}원</div>
          </div>
        ))}
        <hr />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
          <div>합계</div>
          <div>{totalPrice.toLocaleString()}원</div>
        </div>
        <button 
          onClick={handleOrder} 
          disabled={isProcessing}
          style={{ 
            marginTop: 16, 
            padding: '10px 14px', 
            background: isProcessing ? '#9ca3af' : '#16a34a', 
            color: 'white', 
            border: 'none', 
            borderRadius: 6, 
            cursor: isProcessing ? 'not-allowed' : 'pointer' 
          }}
        >
          {isProcessing ? '처리 중...' : '주문 확정'}
        </button>
      </div>
    </main>
  );
};


