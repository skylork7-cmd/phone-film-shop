import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

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

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  compatibility: string[];
  stock: number;
  category: string;
  discountRate?: number;
  discountedPrice?: number;
  discountApplied?: string;
  discountStartDate?: string;
  discountEndDate?: string;
  createdAt: any;
}

interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: any;
  lastLoginAt?: any;
  isAdmin: boolean;
}

export const Admin: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'users'>('orders');
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    compatibility: '',
    stock: '',
    category: 'phone-film',
    discountRate: '',
    discountedPrice: '',
    discountApplied: 'N',
    discountStartDate: '',
    discountEndDate: ''
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // 할인 가격 자동 계산 함수
  const calculateDiscountedPrice = (price: number, discountRate: number) => {
    if (discountRate > 0) {
      return Math.round(price * (1 - discountRate / 100));
    }
    return price;
  };

  // 할인률 변경 핸들러
  const handleDiscountRateChange = (rate: string) => {
    const discountRate = parseFloat(rate) || 0;
    const price = parseFloat(newProduct.price) || 0;
    
    if (discountRate > 0) {
      setNewProduct({
        ...newProduct,
        discountRate: rate,
        discountedPrice: calculateDiscountedPrice(price, discountRate).toString(),
        discountApplied: 'Y'
      });
    } else {
      setNewProduct({
        ...newProduct,
        discountRate: '',
        discountedPrice: price.toString(),
        discountApplied: 'N',
        discountStartDate: '',
        discountEndDate: ''
      });
    }
  };

  // 할인 적용 변경 핸들러
  const handleDiscountAppliedChange = (applied: string) => {
    if (applied === 'N') {
      setNewProduct({
        ...newProduct,
        discountApplied: 'N',
        discountRate: '',
        discountedPrice: newProduct.price,
        discountStartDate: '',
        discountEndDate: ''
      });
    } else {
      setNewProduct({
        ...newProduct,
        discountApplied: 'Y',
        discountedPrice: newProduct.price
      });
    }
  };

  // 가격 변경 핸들러
  const handlePriceChange = (price: string) => {
    const priceValue = parseFloat(price) || 0;
    const discountRate = parseFloat(newProduct.discountRate) || 0;
    
    setNewProduct({
      ...newProduct,
      price: price,
      discountedPrice: newProduct.discountApplied === 'Y' ? 
        calculateDiscountedPrice(priceValue, discountRate).toString() : 
        price
    });
  };

  useEffect(() => {
    // 관리자 권한 확인
    if (!isAuthenticated || user?.email !== 'admin@gmail.com') {
      alert('관리자 권한이 필요합니다.');
      navigate('/');
      return;
    }

    loadOrders();
    loadProducts();
    loadUsers();
  }, [isAuthenticated, user, navigate]);

  const loadOrders = async () => {
    try {
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      // 생성일 기준으로 최신순 정렬
      ordersData.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
      setOrders(ordersData);
    } catch (error) {
      console.error('주문 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      // 생성일 기준으로 최신순 정렬
      productsData.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
      setProducts(productsData);
    } catch (error) {
      console.error('상품 데이터 로드 실패:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      
      // 생성일 기준으로 최신순 정렬
      usersData.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
      setUsers(usersData);
    } catch (error) {
      console.error('사용자 데이터 로드 실패:', error);
    }
  };

          // Firebase 연결 테스트 함수
        const testFirebaseConnection = async () => {
          try {
            console.log('Firebase 연결 테스트 시작...');
            console.log('Firebase 설정 확인:', {
              projectId: db.app.options.projectId
            });

            // 간단한 테스트 문서 생성
            const testData = {
              test: true,
              timestamp: new Date(),
              message: 'Firebase 연결 테스트'
            };

            console.log('테스트 데이터:', testData);

            const testRef = await addDoc(collection(db, 'test'), testData);
            console.log('Firebase 연결 성공:', testRef.id);

            // 테스트 문서 삭제
            await deleteDoc(doc(db, 'test', testRef.id));
            console.log('테스트 문서 삭제 완료');

            alert('Firebase 연결이 정상입니다!');
            return true;
          } catch (error: any) {
            console.error('Firebase 연결 테스트 실패:', error);
            console.error('에러 상세 정보:', {
              code: error.code,
              message: error.message,
              stack: error.stack,
              details: error.details
            });
            alert(`Firebase 연결 실패: ${error.code || error.message}`);
            return false;
          }
        };

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 데이터 유효성 검사
      if (!newProduct.name || !newProduct.description || !newProduct.price || !newProduct.imageUrl || !newProduct.compatibility || !newProduct.stock) {
        alert('모든 필드를 입력해주세요.');
        return;
      }

      // 할인 필드 정규화
      const priceNum = Number(newProduct.price);
      const isApplied = newProduct.discountApplied === 'Y';
      const rateNum = isApplied && newProduct.discountRate ? Number(newProduct.discountRate) : 0;
      const discountedNum = isApplied && rateNum > 0
        ? Math.round(priceNum * (1 - rateNum / 100))
        : priceNum;
      const startDate = isApplied ? (newProduct.discountStartDate || '') : '';
      const endDate = isApplied ? (newProduct.discountEndDate || '') : '';

      // 간단한 데이터 구조로 변경
      const productData = {
        name: newProduct.name.trim(),
        description: newProduct.description.trim(),
        price: priceNum,
        currency: 'KRW',
        imageUrl: newProduct.imageUrl.trim(),
        compatibility: newProduct.compatibility.split(',').map(item => item.trim()).filter(item => item.length > 0),
        stock: Number(newProduct.stock),
        category: 'phone-film',
        discountRate: rateNum,
        discountedPrice: discountedNum,
        discountApplied: isApplied ? 'Y' : 'N',
        discountStartDate: startDate,
        discountEndDate: endDate,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 데이터 검증
      if (productData.price <= 0) {
        alert('가격은 0보다 커야 합니다.');
        return;
      }

      if (productData.stock < 0) {
        alert('재고는 0 이상이어야 합니다.');
        return;
      }

      if (productData.compatibility.length === 0) {
        alert('호환 기종을 입력해주세요.');
        return;
      }

      console.log('등록할 상품 데이터:', productData);

      // Firebase에 직접 추가
      console.log('Firebase addDoc 호출 시작...');
      const docRef = await addDoc(collection(db, 'products'), productData);
      
      console.log('상품 등록 성공, 문서 ID:', docRef.id);
      console.log('Firebase 응답 확인:', docRef);
      alert('상품이 성공적으로 등록되었습니다!');
      
      setShowProductModal(false);
      setNewProduct({
        name: '',
        description: '',
        price: '',
        imageUrl: '',
        compatibility: '',
        stock: '',
        category: 'phone-film',
        discountRate: '',
        discountedPrice: '',
        discountApplied: 'N',
        discountStartDate: '',
        discountEndDate: ''
      });
      
      // 상품 목록 새로고침
      setTimeout(() => {
        loadProducts();
      }, 1000);
      
    } catch (error: any) {
      console.error('상품 등록 실패:', error);
      console.error('에러 상세 정보:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
        details: error.details,
        name: error.name
      });
      
      // 구체적인 에러 메시지 표시
      if (error.code === 'permission-denied') {
        alert('권한이 없습니다. Firebase 보안 규칙을 확인해주세요.');
      } else if (error.code === 'invalid-argument') {
        alert('잘못된 데이터 형식입니다. 입력값을 확인해주세요.');
      } else if (error.code === 'unavailable') {
        alert('Firebase 서비스에 연결할 수 없습니다. 네트워크를 확인해주세요.');
      } else {
        alert(`상품 등록에 실패했습니다: ${error.message || error.code || '알 수 없는 오류'}`);
      }
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!window.confirm('정말로 이 상품을 삭제하시겠습니까?')) return;
    
    try {
      await deleteDoc(doc(db, 'products', productId));
      setProducts(prev => prev.filter(product => product.id !== productId));
      alert('상품이 삭제되었습니다.');
    } catch (error) {
      console.error('상품 삭제 실패:', error);
      alert('상품 삭제에 실패했습니다.');
    }
  };

  const editProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingProduct) return;
    
    try {
      // 데이터 유효성 검사
      if (!newProduct.name || !newProduct.description || !newProduct.price || !newProduct.imageUrl || !newProduct.compatibility || !newProduct.stock) {
        alert('모든 필드를 입력해주세요.');
        return;
      }

      // 할인 필드 정규화 (수정)
      const editPriceNum = Number(newProduct.price);
      const editIsApplied = newProduct.discountApplied === 'Y';
      const editRateNum = editIsApplied && newProduct.discountRate ? Number(newProduct.discountRate) : 0;
      const editDiscountedNum = editIsApplied && editRateNum > 0
        ? Math.round(editPriceNum * (1 - editRateNum / 100))
        : editPriceNum;
      const editStartDate = editIsApplied ? (newProduct.discountStartDate || '') : '';
      const editEndDate = editIsApplied ? (newProduct.discountEndDate || '') : '';

      // 수정할 데이터 구조
      const updatedProductData = {
        name: newProduct.name.trim(),
        description: newProduct.description.trim(),
        price: editPriceNum,
        currency: 'KRW',
        imageUrl: newProduct.imageUrl.trim(),
        compatibility: newProduct.compatibility.split(',').map(item => item.trim()).filter(item => item.length > 0),
        stock: Number(newProduct.stock),
        category: 'phone-film',
        discountRate: editRateNum,
        discountedPrice: editDiscountedNum,
        discountApplied: editIsApplied ? 'Y' : 'N',
        discountStartDate: editStartDate,
        discountEndDate: editEndDate,
        updatedAt: new Date()
      };

      // 데이터 검증
      if (updatedProductData.price <= 0) {
        alert('가격은 0보다 커야 합니다.');
        return;
      }

      if (updatedProductData.stock < 0) {
        alert('재고는 0 이상이어야 합니다.');
        return;
      }

      if (updatedProductData.compatibility.length === 0) {
        alert('호환 기종을 입력해주세요.');
        return;
      }

      console.log('수정할 상품 데이터:', updatedProductData);

      // Firebase에서 상품 수정
      await updateDoc(doc(db, 'products', editingProduct.id), updatedProductData);
      
      console.log('상품 수정 성공');
      alert('상품이 성공적으로 수정되었습니다!');
      
      setEditingProduct(null);
      setShowProductModal(false);
      setNewProduct({
        name: '',
        description: '',
        price: '',
        imageUrl: '',
        compatibility: '',
        stock: '',
        category: 'phone-film',
        discountRate: '',
        discountedPrice: '',
        discountApplied: 'N',
        discountStartDate: '',
        discountEndDate: ''
      });
      
      // 상품 목록 새로고침
      setTimeout(() => {
        loadProducts();
      }, 1000);
      
    } catch (error: any) {
      console.error('상품 수정 실패:', error);
      console.error('에러 상세 정보:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
        details: error.details,
        name: error.name
      });
      
      // 구체적인 에러 메시지 표시
      if (error.code === 'permission-denied') {
        alert('권한이 없습니다. Firebase 보안 규칙을 확인해주세요.');
      } else if (error.code === 'invalid-argument') {
        alert('잘못된 데이터 형식입니다. 입력값을 확인해주세요.');
      } else if (error.code === 'unavailable') {
        alert('Firebase 서비스에 연결할 수 없습니다. 네트워크를 확인해주세요.');
      } else {
        alert(`상품 수정에 실패했습니다: ${error.message || error.code || '알 수 없는 오류'}`);
      }
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      imageUrl: product.imageUrl,
      compatibility: product.compatibility.join(', '),
      stock: product.stock.toString(),
      category: product.category,
      discountRate: product.discountRate?.toString() || '',
      discountedPrice: product.discountedPrice?.toString() || product.price.toString(),
      discountApplied: product.discountApplied || 'N',
      discountStartDate: product.discountStartDate || '',
      discountEndDate: product.discountEndDate || ''
    });
    setShowProductModal(true);
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
      await deleteDoc(doc(db, 'orders', orderId));
      setOrders(prev => prev.filter(order => order.id !== orderId));
      alert('주문이 삭제되었습니다.');
    } catch (error) {
      console.error('주문 삭제 실패:', error);
      alert('주문 삭제에 실패했습니다.');
    }
  };

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

  if (!isAuthenticated || user?.email !== 'admin@gmail.com') {
    return null;
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        fontSize: '18px',
        color: '#6b7280'
      }}>
        로딩 중...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      {/* 헤더 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '32px',
        paddingBottom: '16px',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#1f2937', margin: 0 }}>
          관리자 대시보드
        </h1>
        <div style={{ color: '#6b7280', fontSize: '16px' }}>
          안녕하세요, {user?.email}님
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '32px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '12px 24px',
            background: activeTab === 'orders' ? '#32CD32' : 'transparent',
            color: activeTab === 'orders' ? 'white' : '#374151',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '16px'
          }}
        >
          주문 관리 ({orders.length})
        </button>
                 <button
           onClick={() => setActiveTab('products')}
           style={{
             padding: '12px 24px',
             background: activeTab === 'products' ? '#32CD32' : 'transparent',
             color: activeTab === 'products' ? 'white' : '#374151',
             border: 'none',
             borderRadius: '8px 8px 0 0',
             cursor: 'pointer',
             fontWeight: 600,
             fontSize: '16px'
           }}
         >
           상품 관리 ({products.length})
         </button>
         <button
           onClick={() => setActiveTab('users')}
           style={{
             padding: '12px 24px',
             background: activeTab === 'users' ? '#32CD32' : 'transparent',
             color: activeTab === 'users' ? 'white' : '#374151',
             border: 'none',
             borderRadius: '8px 8px 0 0',
             cursor: 'pointer',
             fontWeight: 600,
             fontSize: '16px'
           }}
         >
           사용자 관리 ({users.length})
         </button>
      </div>

      {/* 주문 관리 탭 */}
      {activeTab === 'orders' && (
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
      )}

      {/* 상품 관리 탭 */}
      {activeTab === 'products' && (
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#1f2937', margin: 0 }}>
              상품 목록
            </h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={loadProducts}
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
              <button
                onClick={testFirebaseConnection}
                style={{
                  padding: '8px 16px',
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                연결 테스트
              </button>
              <button
                onClick={() => setShowProductModal(true)}
                style={{
                  padding: '8px 16px',
                  background: '#32CD32',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                상품 추가
              </button>
            </div>
          </div>

          {products.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '48px', 
              color: '#6b7280',
              fontSize: '18px'
            }}>
              등록된 상품이 없습니다.
              <br />
              "상품 추가" 버튼을 클릭하여 첫 번째 상품을 등록해보세요.
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gap: '16px',
              maxHeight: '70vh',
              overflow: 'auto'
            }}>
              {products.map((product) => (
                <div key={product.id} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '20px',
                  background: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '80px 1fr auto',
                    gap: '16px',
                    alignItems: 'center'
                  }}>
                    {/* 상품 이미지 */}
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                    />

                    {/* 상품 정보 */}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>
                        {product.name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                        {product.description}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        호환: {product.compatibility.join(', ')}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                        등록일: {product.createdAt?.toDate().toLocaleDateString()}
                      </div>
                    </div>

                                         {/* 가격 및 액션 */}
                     <div style={{ textAlign: 'right' }}>
                       <div style={{ marginBottom: '8px' }}>
                         <div style={{ fontWeight: 600, fontSize: '18px', color: '#1f2937' }}>
                           {(product.discountedPrice || product.price).toLocaleString()}원
                         </div>
                         {product.discountApplied === 'Y' && product.discountRate && product.discountRate > 0 && (
                           <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600 }}>
                             {product.discountRate}% 할인
                           </div>
                         )}
                         {product.discountApplied === 'Y' && product.price !== (product.discountedPrice || product.price) && (
                           <div style={{ fontSize: '12px', color: '#6b7280', textDecoration: 'line-through' }}>
                             원가: {product.price.toLocaleString()}원
                           </div>
                         )}
                       </div>
                       <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                         재고: {product.stock}개
                       </div>
                       <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                         <button
                           onClick={() => openEditModal(product)}
                           style={{
                             padding: '6px 12px',
                             background: '#3b82f6',
                             color: 'white',
                             border: 'none',
                             borderRadius: '4px',
                             cursor: 'pointer',
                             fontSize: '12px'
                           }}
                         >
                           수정
                         </button>
                         <button
                           onClick={() => deleteProduct(product.id)}
                           style={{
                             padding: '6px 12px',
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
                </div>
              ))}
            </div>
          )}
                 </div>
       )}

       {/* 사용자 관리 탭 */}
       {activeTab === 'users' && (
         <div>
           <div style={{ 
             display: 'flex', 
             justifyContent: 'space-between', 
             alignItems: 'center',
             marginBottom: '24px'
           }}>
             <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#1f2937', margin: 0 }}>
               사용자 목록
             </h2>
             <button
               onClick={loadUsers}
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

           {users.length === 0 ? (
             <div style={{ 
               textAlign: 'center', 
               padding: '48px', 
               color: '#6b7280',
               fontSize: '18px'
             }}>
               등록된 사용자가 없습니다.
             </div>
           ) : (
             <div style={{ 
               display: 'grid', 
               gap: '16px',
               maxHeight: '70vh',
               overflow: 'auto'
             }}>
               {users.map((user) => (
                 <div key={user.id} style={{
                   border: '1px solid #e5e7eb',
                   borderRadius: '12px',
                   padding: '20px',
                   background: 'white',
                   boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                 }}>
                   <div style={{ 
                     display: 'grid', 
                     gridTemplateColumns: '1fr auto auto',
                     gap: '16px',
                     alignItems: 'center'
                   }}>
                     {/* 사용자 정보 */}
                     <div>
                       <div style={{ 
                         display: 'flex', 
                         alignItems: 'center', 
                         gap: '12px',
                         marginBottom: '8px'
                       }}>
                         <span style={{ 
                           padding: '4px 8px',
                           background: user.isAdmin ? '#ef4444' : '#10b981',
                           color: 'white',
                           borderRadius: '4px',
                           fontSize: '12px',
                           fontWeight: 600
                         }}>
                           {user.isAdmin ? '관리자' : '일반 사용자'}
                         </span>
                         <span style={{ fontSize: '12px', color: '#6b7280' }}>
                           {user.createdAt?.toDate().toLocaleString()}
                         </span>
                       </div>
                       <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>
                         {user.displayName || '이름 없음'}
                       </div>
                       <div style={{ fontSize: '14px', color: '#6b7280' }}>
                         {user.email}
                       </div>
                       {user.lastLoginAt && (
                         <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                           마지막 로그인: {user.lastLoginAt?.toDate().toLocaleString()}
                         </div>
                       )}
                     </div>

                     {/* 사용자 ID */}
                     <div style={{ textAlign: 'center' }}>
                       <div style={{ fontSize: '14px', color: '#6b7280' }}>사용자 ID</div>
                       <div style={{ fontWeight: 600, fontSize: '12px', wordBreak: 'break-all' }}>
                         {user.id}
                       </div>
                     </div>

                     {/* 액션 버튼 */}
                     <div style={{ display: 'flex', gap: '8px' }}>
                       <button
                         onClick={() => {
                           if (user.isAdmin) {
                             alert('관리자는 삭제할 수 없습니다.');
                             return;
                           }
                           if (window.confirm('정말로 이 사용자를 삭제하시겠습니까?')) {
                             // 사용자 삭제 로직 (실제로는 Firebase Auth에서 삭제해야 함)
                             alert('사용자 삭제 기능은 Firebase Admin SDK가 필요합니다.');
                           }
                         }}
                         style={{
                           padding: '6px 12px',
                           background: user.isAdmin ? '#9ca3af' : '#ef4444',
                           color: 'white',
                           border: 'none',
                           borderRadius: '4px',
                           cursor: user.isAdmin ? 'not-allowed' : 'pointer',
                           fontSize: '12px',
                           opacity: user.isAdmin ? 0.5 : 1
                         }}
                         disabled={user.isAdmin}
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
       )}

       {/* 상품 추가 모달 */}
      {showProductModal && (
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
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
                         <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', textAlign: 'center' }}>
               {editingProduct ? '상품 수정' : '새 상품 등록'}
             </h2>
             
             <form onSubmit={editingProduct ? editProduct : addProduct}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                  상품명 *
                </label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="상품명을 입력하세요"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                  상품 설명 *
                </label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
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
                  placeholder="상품 설명을 입력하세요"
                />
              </div>              

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                  이미지 URL *
                </label>
                <input
                  type="url"
                  value={newProduct.imageUrl}
                  onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="이미지 URL을 입력하세요"
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                  호환 기종 *
                </label>
                <input
                  type="text"
                  value={newProduct.compatibility}
                  onChange={(e) => setNewProduct({...newProduct, compatibility: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="iPhone 15, iPhone 15 Pro (쉼표로 구분)"
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                  재고 수량 *
                </label>
                <input
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                  required
                  min="0"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="재고 수량을 입력하세요"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                  원가 (원) *
                </label>
                <input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  required
                  min="0"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="원가를 입력하세요"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                  판매가격 (원) *
                </label>
                <input
                  type="number"
                  value={newProduct.discountedPrice}
                  onChange={(e) => setNewProduct({...newProduct, discountedPrice: e.target.value})}
                  required
                  min="0"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    backgroundColor: newProduct.discountApplied === 'N' ? '#f9fafb' : 'white'
                  }}
                  placeholder="판매가격을 입력하세요"
                  disabled={newProduct.discountApplied === 'N'}
                />
                {newProduct.discountApplied === 'N' && (
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    할인 적용이 'N'일 때는 원가와 동일하게 설정됩니다.
                  </div>
                )}
              </div>

              {/* 할인 정보 섹션 */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#374151', marginBottom: '16px' }}>
                  할인 정보
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                      할인 적용
                    </label>
                    <select
                      value={newProduct.discountApplied}
                      onChange={(e) => handleDiscountAppliedChange(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '16px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="N">미적용</option>
                      <option value="Y">적용</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                      할인률 (%)
                    </label>
                    <input
                      type="number"
                      value={newProduct.discountRate}
                      onChange={(e) => handleDiscountRateChange(e.target.value)}
                      min="0"
                      max="100"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '16px',
                        boxSizing: 'border-box',
                        backgroundColor: newProduct.discountApplied === 'N' ? '#f9fafb' : 'white'
                      }}
                      placeholder="할인률"
                      disabled={newProduct.discountApplied === 'N'}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                      할인 시작일
                    </label>
                    <input
                      type="datetime-local"
                      value={newProduct.discountStartDate}
                      onChange={(e) => setNewProduct({...newProduct, discountStartDate: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '16px',
                        boxSizing: 'border-box',
                        backgroundColor: newProduct.discountApplied === 'N' ? '#f9fafb' : 'white'
                      }}
                      disabled={newProduct.discountApplied === 'N'}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                      할인 종료일
                    </label>
                    <input
                      type="datetime-local"
                      value={newProduct.discountEndDate}
                      onChange={(e) => setNewProduct({...newProduct, discountEndDate: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '16px',
                        boxSizing: 'border-box',
                        backgroundColor: newProduct.discountApplied === 'N' ? '#f9fafb' : 'white'
                      }}
                      disabled={newProduct.discountApplied === 'N'}
                    />
                  </div>
                </div>

              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                                 <button
                   type="button"
                   onClick={() => {
                     setShowProductModal(false);
                     setEditingProduct(null);
                     setNewProduct({
                       name: '',
                       description: '',
                       price: '',
                       imageUrl: '',
                       compatibility: '',
                       stock: '',
                       category: 'phone-film',
                       discountRate: '',
                       discountedPrice: '',
                       discountApplied: 'N',
                       discountStartDate: '',
                       discountEndDate: ''
                     });
                   }}
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
                   style={{
                     flex: 1,
                     padding: '14px',
                     background: '#32CD32',
                     color: 'white',
                     border: 'none',
                     borderRadius: '6px',
                     fontSize: '16px',
                     fontWeight: 600,
                     cursor: 'pointer'
                   }}
                 >
                   {editingProduct ? '상품 수정' : '상품 등록'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
