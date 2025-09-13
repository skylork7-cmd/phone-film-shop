import React from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface Order {
  id: string;
  userId: string;
  userEmail: string;
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  totalPrice: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  orderStatus: string;
  createdAt: any;
}

interface OrdersTabProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  loadOrders: () => Promise<void>;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({ orders, setOrders, loadOrders }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'confirmed': return '#3b82f6';
      case 'shipped': return '#8b5cf6';
      case 'delivered': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'confirmed': return '확인됨';
      case 'shipped': return '배송중';
      case 'delivered': return '배송완료';
      case 'cancelled': return '취소됨';
      default: return status;
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        orderStatus: newStatus,
        updatedAt: new Date()
      });
      
      // 로컬 상태 업데이트
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, orderStatus: newStatus } : order
      ));
      
      alert('주문 상태가 업데이트되었습니다.');
    } catch (error) {
      console.error('주문 상태 업데이트 실패:', error);
      alert('주문 상태 업데이트에 실패했습니다.');
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!window.confirm('정말로 이 주문을 삭제하시겠습니까?')) return;
    
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      if (!orderSnap.exists()) {
        alert('주문을 찾을 수 없습니다.');
        return;
      }
      const orderData = orderSnap.data() as any;
      const productId = orderData.productId;
      const qty = Number(orderData.quantity) || 0;

      await runTransaction(db, async (tx) => {
        const productRef = doc(db, 'products', productId);
        const productSnap = await tx.get(productRef);
        if (!productSnap.exists()) {
          throw new Error('상품을 찾을 수 없습니다.');
        }
        const pData: any = productSnap.data() || {};
        const currentStock = typeof pData.stock === 'number' ? pData.stock : 0;
        tx.update(productRef, {
          stock: currentStock + qty,
          updatedAt: new Date()
        });
        tx.delete(orderRef);
      });

      setOrders(prev => prev.filter(order => order.id !== orderId));
      alert('주문이 삭제되었고, 상품 재고가 복원되었습니다.');
    } catch (error) {
      console.error('주문 삭제 실패:', error);
      alert('주문 삭제에 실패했습니다.');
    }
  };

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#1f2937', margin: 0 }}>
          주문 목록
        </h2>
        <button
          onClick={loadOrders}
          style={{
            padding: '8px 16px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          새로고침
        </button>
      </div>

      {orders.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '48px', 
          color: '#6b7280',
          fontSize: '18px'
        }}>
          아직 주문이 없습니다.
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gap: '16px',
          maxHeight: '70vh',
          overflow: 'auto'
        }}>
          {orders.map((order) => (
            <div key={order.id} style={{
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '20px',
              background: 'white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr auto auto auto',
                gap: '16px',
                alignItems: 'center'
              }}>
                {/* 주문 정보 */}
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    marginBottom: '8px'
                  }}>
                    <span style={{ 
                      padding: '4px 8px',
                      background: getStatusColor(order.orderStatus),
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600
                    }}>
                      {getStatusText(order.orderStatus)}
                    </span>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      {order.createdAt?.toDate().toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>
                    {order.productName}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    {order.customerName} | {order.customerPhone}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    {order.customerAddress}
                  </div>
                </div>

                {/* 수량 및 가격 */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>수량</div>
                  <div style={{ fontWeight: 600 }}>{order.quantity}개</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>총 금액</div>
                  <div style={{ fontWeight: 600, color: '#1f2937' }}>
                    {order.totalPrice.toLocaleString()}원
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={order.orderStatus}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    style={{
                      padding: '6px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  >
                    <option value="pending">대기중</option>
                    <option value="confirmed">확인됨</option>
                    <option value="shipped">배송중</option>
                    <option value="delivered">배송완료</option>
                    <option value="cancelled">취소됨</option>
                  </select>
                  <button
                    onClick={() => deleteOrder(order.id)}
                    style={{
                      padding: '6px 8px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
