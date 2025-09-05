import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Product } from '../types/Product';

export const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const productsData = productsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
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
        };
      });
      
      // 최신순으로 정렬 (최대 6개만 표시)
      productsData.sort((a, b) => b.id.localeCompare(a.id));
      
      // 4개 미만일 때 임의 상품으로 채우기
      const displayProducts = [...productsData];
      const dummyProducts = [
        {
          id: 'dummy1',
          name: 'iPhone 15 Pro 보호필름',
          description: '9H 경도 다이아몬드 급 보호 필름으로 스크래치 완벽 방지',
          price: 25000,
          currency: 'KRW' as const,
          imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTMwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2QjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPuaPkOS6pOaTjeS9nDwvdGV4dD4KPHRleHQgeD0iMTUwIiB5PSIxNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZCNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+aVBob25lIDE1IFBybzwvdGV4dD4KPC9zdmc+',
          compatibility: ['iPhone 15 Pro'],
          stock: 50,
          discountRate: 0,
          discountedPrice: 25000,
          discountApplied: 'N',
          discountStartDate: '',
          discountEndDate: ''
        },
        {
          id: 'dummy2',
          name: 'Galaxy S24 Ultra 보호필름',
          description: '올레포빅 코팅으로 지문과 오일 차단, 깔끔함 유지',
          price: 28000,
          currency: 'KRW' as const,
          imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTMwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2QjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPuaPkOS6pOaTjeS9nDwvdGV4dD4KPHRleHQgeD0iMTUwIiB5PSIxNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZCNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+R2FsYXh5IFMyNCBVbHRyYTwvdGV4dD4KPC9zdmc+',
          compatibility: ['Galaxy S24 Ultra'],
          stock: 45,
          discountRate: 0,
          discountedPrice: 28000,
          discountApplied: 'N',
          discountStartDate: '',
          discountEndDate: ''
        },
        {
          id: 'dummy3',
          name: 'iPhone 15 보호필름',
          description: '가장자리까지 완벽 보호하는 엣지 투 엣지 커버리지',
          price: 22000,
          currency: 'KRW' as const,
          imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTMwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2QjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPuaPkOS6pOaTjeS9nDwvdGV4dD4KPHRleHQgeD0iMTUwIiB5PSIxNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZCNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+aVBob25lIDE1PC90ZXh0Pgo8L3N2Zz4=',
          compatibility: ['iPhone 15'],
          stock: 60,
          discountRate: 0,
          discountedPrice: 22000,
          discountApplied: 'N',
          discountStartDate: '',
          discountEndDate: ''
        },
        {
          id: 'dummy4',
          name: 'Galaxy S24 보호필름',
          description: '투명도 99.9%의 고품질 보호 필름으로 화질 손실 없음',
          price: 20000,
          currency: 'KRW' as const,
          imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTMwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2QjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPuaPkOS6pOaTjeS9nDwvdGV4dD4KPHRleHQgeD0iMTUwIiB5PSIxNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZCNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+R2FsYXh5IFMyNDwvdGV4dD4KPC9zdmc+',
          compatibility: ['Galaxy S24'],
          stock: 55,
          discountRate: 0,
          discountedPrice: 20000,
          discountApplied: 'N',
          discountStartDate: '',
          discountEndDate: ''
        }
      ];
      
      // 실제 상품이 4개 미만이면 더미 상품으로 채우기
      while (displayProducts.length < 4) {
        const dummyIndex = displayProducts.length;
        if (dummyIndex < dummyProducts.length) {
          displayProducts.push(dummyProducts[dummyIndex]);
        }
      }
      
      setProducts(displayProducts.slice(0, 6));
    } catch (error) {
      console.error('상품 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Top Banner */}
      <div style={{
        background: '#1f2937',
        color: 'white',
        padding: '8px 0',
        textAlign: 'center',
        fontSize: '14px'
      }}>
        무료 배송 (5만원 이상) • 30일 환불 보장 • BOGO 특가 진행중!
      </div>

      {/* Hero Section with Zombi Barrier Logo */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '80px 20px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Large Logo */}
          <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: '120px',
              height: '120px',
              background: '#32CD32',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 25px rgba(50, 205, 50, 0.3)'
            }}>
              {/* Large Stylized Z icon */}
              <div style={{
                width: '60px',
                height: '60px',
                position: 'relative',
                transform: 'rotate(-15deg)'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  width: '8px',
                  height: '60px',
                  background: 'white',
                  borderRadius: '4px'
                }}></div>
                <div style={{
                  position: 'absolute',
                  top: '25px',
                  left: '0',
                  width: '50px',
                  height: '8px',
                  background: 'white',
                  borderRadius: '4px',
                  transform: 'rotate(-45deg)'
                }}></div>
                <div style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  width: '8px',
                  height: '60px',
                  background: 'white',
                  borderRadius: '4px'
                }}></div>
              </div>
            </div>
          </div>
          
          <h1 style={{ fontSize: '56px', marginBottom: '24px', fontWeight: 700 }}>
            Zombi Barrier
          </h1>
          <p style={{ fontSize: '24px', marginBottom: '40px', opacity: 0.9, maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
            최고의 화면 보호 필름으로 당신의 기기를 완벽하게 보호하세요
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button style={{
              padding: '18px 36px',
              background: 'white',
              color: '#667eea',
              border: 'none',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              상품 보기
            </button>
            {!isAuthenticated && (
              <Link to="/login" style={{
                padding: '18px 36px',
                background: 'transparent',
                color: 'white',
                border: '2px solid white',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-block'
              }}>
                로그인
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Device Selection */}
      <section style={{ padding: '60px 20px', background: 'white' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '36px', marginBottom: '48px', color: '#1f2937' }}>
            당신의 기기를 선택하세요
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
            {['iPhone 15', 'iPhone 15 Pro', 'Galaxy S24', 'Galaxy S24 Ultra'].map((device) => (
                             <div key={device} style={{
                 padding: '24px',
                 border: '2px solid #e5e7eb',
                 borderRadius: '12px',
                 textAlign: 'center',
                 cursor: 'pointer',
                 transition: 'all 0.2s ease'
               }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📱</div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937' }}>{device}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section style={{ padding: '80px 20px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '36px', marginBottom: '48px', color: '#1f2937' }}>
            판매 상품
          </h2>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280', fontSize: '18px' }}>
              상품을 불러오는 중...
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280', fontSize: '18px' }}>
              등록된 상품이 없습니다.
              <br />
              관리자 페이지에서 상품을 등록해주세요.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px' }}>
              {products.map((p) => (
                                 <div key={p.id} style={{
                   background: 'white',
                   borderRadius: '12px',
                   overflow: 'hidden',
                   boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                   transition: 'transform 0.2s ease',
                   cursor: 'pointer'
                 }}>
                  <Link to={`/product/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <img 
                      src={p.imageUrl} 
                      alt={p.name}
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{ padding: '24px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px', color: '#1f2937' }}>
                        {p.name}
                      </h3>
                      <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px', lineHeight: '1.5', minHeight: '42px' }}>
                        {p.description}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ fontWeight: 700, fontSize: '20px', color: '#1f2937' }}>
                          {(p.discountedPrice || p.price).toLocaleString()}원
                          {typeof (p as any).discountRate === 'number' && (p as any).discountRate > 0 && (
                            <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600, marginLeft: '8px' }}>
                              {(p as any).discountRate}% 할인
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          호환: {p.compatibility[0]}
                        </div>
                      </div>
                      <button style={{
                        width: '100%',
                        padding: '12px',
                        background: '#1f2937',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}>
                        장바구니 담기
                      </button>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '80px 20px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '36px', marginBottom: '48px', color: '#1f2937' }}>
            Zombi Barrier의 특징
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px' }}>
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <div style={{ fontSize: '64px', marginBottom: '24px' }}>🛡️</div>
              <h3 style={{ fontSize: '24px', marginBottom: '16px', color: '#1f2937' }}>9H 경도 보호</h3>
              <p style={{ color: '#6b7280', lineHeight: '1.6' }}>다이아몬드 급 경도로 스크래치로부터 완벽 보호합니다</p>
            </div>
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <div style={{ fontSize: '64px', marginBottom: '24px' }}>👆</div>
              <h3 style={{ fontSize: '24px', marginBottom: '16px', color: '#1f2937' }}>올레포빅 코팅</h3>
              <p style={{ color: '#6b7280', lineHeight: '1.6' }}>지문과 오일을 차단하는 특수 코팅으로 깔끔함을 유지합니다</p>
            </div>
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔒</div>
              <h3 style={{ fontSize: '24px', marginBottom: '16px', color: '#1f2937' }}>가장자리 보호</h3>
              <p style={{ color: '#6b7280', lineHeight: '1.6' }}>화면 가장자리까지 완벽하게 보호하여 안전성을 높입니다</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section style={{
        background: '#1f2937',
        color: 'white',
        padding: '60px 20px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', marginBottom: '16px' }}>
            최신 정보를 받아보세요
          </h2>
          <p style={{ fontSize: '18px', marginBottom: '32px', opacity: 0.8 }}>
            10% 할인 쿠폰과 최신 제품 정보를 이메일로 받아보세요
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <input
              type="email"
              placeholder="이메일 주소를 입력하세요"
              style={{
                padding: '14px 16px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                minWidth: '300px',
                flex: 1
              }}
            />
            <button style={{
              padding: '14px 24px',
              background: '#32CD32',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer'
            }}>
              구독하기
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#111827',
        color: 'white',
        padding: '40px 20px',
        fontSize: '14px'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <p>© 2025 Zombi Barrier, LLC. All Rights Reserved.</p>
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <span>개인정보처리방침</span>
            <span>이용약관</span>
            <span>배송정보</span>
            <span>환불정책</span>
            <span>고객지원</span>
          </div>
        </div>
      </footer>
    </div>
  );
};


