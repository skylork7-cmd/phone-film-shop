import React from 'react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';

export const CartPage: React.FC = () => {
  const { items, setQuantity, removeItem, totalPrice } = useCart();
  const isEmpty = items.length === 0;

  return (
    <main style={{ maxWidth: 900, margin: '24px auto', padding: '0 16px' }}>
      <h1>장바구니</h1>
      {isEmpty ? (
        <div>
          장바구니가 비었습니다. <Link to="/">상품 보러가기</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {items.map(({ product, quantity }) => (
            <div key={product.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: 12, alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
              <img src={product.imageUrl} alt={product.name} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }} />
              <div>
                <div style={{ fontWeight: 600 }}>{product.name}</div>
                <div style={{ color: '#6b7280', fontSize: 14 }}>{product.price.toLocaleString()}원</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(product.id, Math.max(1, Number(e.target.value)))}
                  style={{ width: 64, padding: '6px 8px' }}
                />
                <button onClick={() => removeItem(product.id)} style={{ padding: '6px 10px' }}>삭제</button>
              </div>
            </div>
          ))}

          <div style={{ textAlign: 'right', fontWeight: 700, marginTop: 12 }}>
            합계: {totalPrice.toLocaleString()}원
          </div>
          <div style={{ textAlign: 'right' }}>
            <Link to="/checkout">
              <button style={{ padding: '10px 14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                주문하기
              </button>
            </Link>
          </div>
        </div>
      )}
    </main>
  );
};


