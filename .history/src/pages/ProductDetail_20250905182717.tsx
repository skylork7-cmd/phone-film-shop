import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { addDoc, collection, serverTimestamp, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

import { Product } from '../types/Product';

export const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const { addItem } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderInfo, setOrderInfo] = useState({
    name: '',
    phone: '',
    address: '',
    quantity: 1
  });
  const [selectedQty, setSelectedQty] = useState(1);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const productDoc = await getDoc(doc(db, 'products', id));
      
      if (productDoc.exists()) {
        const data = productDoc.data();
        setProduct({
          id: productDoc.id,
          name: data.name,
          description: data.description,
          price: data.price,
          currency: data.currency as 'KRW' | 'USD',
          imageUrl: data.imageUrl,
          compatibility: data.compatibility,
          stock: data.stock,
          discountRate: data.discountRate,
          discountedPrice: data.discountedPrice,
          discountApplied: data.discountApplied,
          discountStartDate: data.discountStartDate,
          discountEndDate: data.discountEndDate
        });
      } else {
        setProduct(null);
      }
    } catch (error) {
      console.error('상품 로드 실패:', error);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main style={{ maxWidth: 1200, margin: '48px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#6b7280' }}>로딩 중...</div>
      </main>
    );
  }

  if (!product) {
    return (
      <main style={{ maxWidth: 1200, margin: '24px auto', padding: '0 24px', textAlign: 'center' }}>
        <h1>상품을 찾을 수 없습니다.</h1>
        <p>요청하신 상품이 존재하지 않습니다.</p>
      </main>
    );
  }

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    setOrderInfo((prev) => ({ ...prev, quantity: selectedQty }));
    setShowOrderModal(true);
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Firebase Firestore에 주문 정보 저장 + 재고 업데이트 트랜잭션
      const qty = orderInfo.quantity;
      const productRef = doc(db, 'products', product.id);

      await (await import('firebase/firestore')).runTransaction(db, async (tx) => {
        const snap = await tx.get(productRef);
        if (!snap.exists()) {
          throw new Error('상품을 찾을 수 없습니다.');
        }
        const pdata: any = snap.data() || {};

        const initialStock = typeof pdata.initialStock === 'number' ? pdata.initialStock : (typeof pdata.stock === 'number' ? pdata.stock : product.stock);
        const currentRemaining = typeof pdata.remainingStock === 'number' ? pdata.remainingStock : (typeof pdata.stock === 'number' ? pdata.stock : product.stock);

        if (qty <= 0) {
          throw new Error('수량이 올바르지 않습니다.');
        }
        if (currentRemaining < qty) {
          throw new Error('재고가 부족합니다.');
        }

        // 주문 문서 참조 생성 (transaction.set 사용)
        const ordersCol = collection(db, 'orders');
        const orderRef = doc(ordersCol);
        const orderData = {
          userId: user?.id,
          userEmail: user?.email,
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          quantity: qty,
          totalPrice: product.price * qty,
          customerName: orderInfo.name,
          customerPhone: orderInfo.phone,
          customerAddress: orderInfo.address,
          orderStatus: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        tx.set(orderRef, orderData);

        // 상품별 구매 이력 (서브컬렉션)
        const purchasesCol = collection(db, `products/${product.id}/purchases`);
        const purchaseRef = doc(purchasesCol);
        tx.set(purchaseRef, {
          userId: user?.id,
          userEmail: user?.email,
          quantity: qty,
          priceEach: product.price,
          totalPrice: product.price * qty,
          createdAt: serverTimestamp()
        });

        // 상품 재고 업데이트 (최초 재고 보존, 남은 재고 차감)
        const newRemaining = currentRemaining - qty;
        tx.update(productRef, {
          initialStock: initialStock,
          remainingStock: newRemaining,
          stock: newRemaining, // UI 호환을 위해 기존 stock 필드도 동기화
          updatedAt: serverTimestamp()
        });
      });

      console.log('주문이 성공적으로 등록되고 재고가 업데이트되었습니다.');
      alert('주문이 성공적으로 등록되었습니다!');
      setShowOrderModal(false);
      setOrderInfo({ name: '', phone: '', address: '', quantity: 1 });

      // 로컬 상태 재고 반영
      setProduct((prev) => (prev ? { ...prev, stock: Math.max(0, prev.stock - qty) } : prev));

      // 주문 완료 후 홈으로 이동
      navigate('/');
    } catch (error: any) {
      console.error('주문/재고 처리 실패:', error);
      alert(error.message || '주문 처리에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <main style={{ maxWidth: 1200, margin: '48px auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'start' }}>
          {/* Product Image */}
          <div>
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              style={{ 
                width: '100%', 
                height: '400px', 
                objectFit: 'cover', 
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }} 
            />
          </div>

          {/* Product Info */}
          <div>
            <h1 style={{ 
              marginTop: 0, 
              fontSize: '32px', 
              fontWeight: 700, 
              color: '#1f2937',
              marginBottom: '16px'
            }}>
              {product.name}
            </h1>
            
            <p style={{ 
              color: '#6b7280', 
              fontSize: '18px', 
              lineHeight: '1.6',
              marginBottom: '24px'
            }}>
              {product.description}
            </p>

            <div style={{ 
              fontSize: '16px', 
              color: '#374151',
              marginTop: '32px',
              padding: '12px',
              background: '#f8fafc',
              borderRadius: '8px'
            }}>
              <strong>호환 기종:</strong> {product.compatibility.join(', ')}
            </div>

            <div style={{ 
              margin: '24px 0', 
              fontWeight: 700, 
              fontSize: '28px', 
              color: '#1f2937',
              textAlign: 'right'
            }}>
              {product.discountApplied === 'Y' && typeof (product as any).discountRate === 'number' && (product as any).discountRate > 0 && (product.discountedPrice || 0) < product.price && (
                <span style={{ fontSize: '16px', color: '#ef4444', fontWeight: 600, marginRight: '8px' }}>
                  {(product as any).discountRate}% 할인
                </span>
              )}
              {(product.discountedPrice || product.price).toLocaleString()}원
              {product.discountApplied === 'Y' && product.discountedPrice && product.discountedPrice < product.price && (
                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                  <span style={{ textDecoration: 'line-through' }}>
                    원가: {product.price.toLocaleString()}원
                  </span>
                </div>
              )}
            </div>

            <div style={{ 
              fontSize: '14px', 
              color: '#6b7280',
              marginBottom: '32px',
              textAlign: 'right'
            }}>
              재고: {product.stock}개{product.discountApplied}
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <label style={{ color: '#374151', fontWeight: 600 }}>수량 선택</label>
              <select
                value={selectedQty}
                onChange={(e) => setSelectedQty(parseInt(e.target.value) || 1)}
                style={{
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: 'white'
                }}
              >
                {Array.from({ length: Math.min(10, Math.max(0, product.stock)) }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <button
                onClick={() => addItem(product, selectedQty)}
                style={{ 
                  padding: '16px 32px', 
                  background: '#1f2937', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 600,
                  flex: 1,
                  minWidth: '200px'
                }}
              >
                장바구니 담기
              </button>
              <button
                onClick={handleBuyNow}
                style={{ 
                  padding: '16px 32px', 
                  background: '#32CD32', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 600,
                  flex: 1,
                  minWidth: '200px'
                }}
              >
                바로 구매
              </button>
            </div>

            {/* Features */}
            <div style={{ marginTop: '48px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px', color: '#1f2937' }}>
                제품 특징
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>✓</span>
                  <span>9H 경도로 스크래치 방지</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>✓</span>
                  <span>올레포빅 코팅으로 지문 방지</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>✓</span>
                  <span>가장자리까지 완벽 보호</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>✓</span>
                  <span>30일 환불 보장</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Order Modal */}
      {showOrderModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', textAlign: 'center' }}>
              주문 정보 입력
            </h2>
            
            <form onSubmit={handleOrderSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                  상품명
                </label>
                <input
                  type="text"
                  value={product.name}
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    background: '#f8fafc'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                  수량
                </label>
                <select
                  value={orderInfo.quantity}
                  onChange={(e) => setOrderInfo({ ...orderInfo, quantity: parseInt(e.target.value) || 1 })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    background: 'white'
                  }}
                >
                  {Array.from({ length: Math.min(10, Math.max(0, product.stock)) }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                  총 금액
                </label>
                <input
                  type="text"
                  value={`${(product.price * orderInfo.quantity).toLocaleString()}원`}
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    background: '#f8fafc',
                    fontWeight: 700
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                  받는 사람 이름 *
                </label>
                <input
                  type="text"
                  value={orderInfo.name}
                  onChange={(e) => setOrderInfo({...orderInfo, name: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="받는 사람 이름을 입력하세요"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                  연락처 *
                </label>
                <input
                  type="tel"
                  value={orderInfo.phone}
                  onChange={(e) => setOrderInfo({...orderInfo, phone: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="010-0000-0000"
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                  배송 주소 *
                </label>
                <textarea
                  value={orderInfo.address}
                  onChange={(e) => setOrderInfo({...orderInfo, address: e.target.value})}
                  required
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                  placeholder="상세한 배송 주소를 입력하세요"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'transparent',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: isLoading ? '#9ca3af' : '#32CD32',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: isLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isLoading ? '주문 처리 중...' : '주문 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};


