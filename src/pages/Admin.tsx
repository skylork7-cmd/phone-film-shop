import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { OrdersTab } from '../components/admin/OrdersTab';
import { ProductsTab } from '../components/admin/ProductsTab';
import { UsersTab } from '../components/admin/UsersTab';
import { SchedulerTab } from '../components/admin/SchedulerTab';

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
  const [schedulers, setSchedulers] = useState<Array<{ id: string; name: string; description: string; cronExpr: string; jobId?: string; schedulerType?: string }>>([]);
  const [schedulerJobs, setSchedulerJobs] = useState<Array<{ id: string; cronExpr: string; running: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'users' | 'schedule'>('orders');

  const loadSchedulerJobs = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/schedules');
      const data = await res.json();
      setSchedulerJobs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('스케줄 목록 조회 실패:', e);
    }
  };

  const loadSchedulers = async () => {
    try {
      const snap = await getDocs(collection(db, 'schedules'));
      const rows = snap.docs.map(d => {
        const data = d.data() as any;
        return {
          id: d.id,
          ...data,
          schedulerType: data.schedulerType || data.jobFunction // 구 필드 호환
        } as { id: string; name: string; description: string; cronExpr: string; jobId?: string; schedulerType?: string };
      });
      setSchedulers(rows);
    } catch (e) {
      console.error('스케줄러 목록 조회 실패:', e);
    }
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

  useEffect(() => {
    if (activeTab === 'schedule') {
      loadSchedulers();
      loadSchedulerJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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
        <button
          onClick={() => setActiveTab('schedule')}
          style={{
            padding: '12px 24px',
            background: activeTab === 'schedule' ? '#32CD32' : 'transparent',
            color: activeTab === 'schedule' ? 'white' : '#374151',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '16px'
          }}
        >
          스케줄러
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'orders' && (
        <OrdersTab 
          orders={orders} 
          setOrders={setOrders} 
          loadOrders={loadOrders} 
        />
      )}

      {activeTab === 'products' && (
        <ProductsTab 
          products={products} 
          setProducts={setProducts} 
          loadProducts={loadProducts} 
        />
      )}

      {activeTab === 'users' && (
        <UsersTab 
          users={users} 
          loadUsers={loadUsers} 
        />
      )}

      {activeTab === 'schedule' && (
        <SchedulerTab 
          schedulers={schedulers}
          setSchedulers={setSchedulers}
          loadSchedulers={loadSchedulers}
          loadSchedulerJobs={loadSchedulerJobs}
          schedulerJobs={schedulerJobs}
        />
      )}
    </div>
  );
};
