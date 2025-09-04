import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { items } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const count = items.reduce((sum, ci) => sum + ci.quantity, 0);

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      background: 'white',
      borderBottom: '1px solid #e5e7eb',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      {/* Zombi Barrier Logo */}
      <Link to="/" style={{ 
        textDecoration: 'none', 
        color: 'inherit',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          background: '#32CD32', // Lime green color
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Stylized Z icon */}
          <div style={{
            width: '24px',
            height: '24px',
            position: 'relative',
            transform: 'rotate(-15deg)'
          }}>
            <div style={{
              position: 'absolute',
              top: '0',
              left: '0',
              width: '4px',
              height: '24px',
              background: 'white',
              borderRadius: '2px'
            }}></div>
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '0',
              width: '20px',
              height: '4px',
              background: 'white',
              borderRadius: '2px',
              transform: 'rotate(-45deg)'
            }}></div>
            <div style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              width: '4px',
              height: '24px',
              background: 'white',
              borderRadius: '2px'
            }}></div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#374151', lineHeight: '1' }}>
            Zombi
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#374151', lineHeight: '1' }}>
            Barrier
          </div>
        </div>
      </Link>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <Link to="/" style={{ 
          textDecoration: 'none', 
          color: '#374151',
          fontWeight: 500,
          fontSize: '16px'
        }}>
          홈
        </Link>
        <Link to="/products" style={{ 
          textDecoration: 'none', 
          color: '#374151',
          fontWeight: 500,
          fontSize: '16px'
        }}>
          상품
        </Link>
        <Link to="/cart" style={{ 
          textDecoration: 'none', 
          color: '#374151',
          fontWeight: 500,
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          장바구니
          {count > 0 && (
            <span style={{
              background: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 600
            }}>
              {count}
            </span>
          )}
        </Link>
        
        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {user?.email === 'admin@gmail.com' && (
              <Link to="/admin" style={{
                padding: '8px 16px',
                background: '#1f2937',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500
              }}>
                관리자
              </Link>
            )}
            <span style={{ color: '#374151', fontSize: '14px' }}>
              안녕하세요, {user?.name}님
            </span>
            <button
              onClick={logout}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              로그아웃
            </button>
          </div>
        ) : (
          <Link to="/login" style={{
            padding: '8px 16px',
            background: '#32CD32',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500
          }}>
            로그인
          </Link>
        )}
      </div>
    </nav>
  );
};
