import React, { createContext, useContext, useMemo, useReducer } from 'react';
import { CartItem, Product } from '../types/Product';

type CartState = {
  items: CartItem[];
};

type CartAction =
  | { type: 'ADD'; product: Product; quantity?: number }
  | { type: 'REMOVE'; productId: string }
  | { type: 'SET_QTY'; productId: string; quantity: number }
  | { type: 'CLEAR' };

const CartContext = createContext<{
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  totalPrice: number;
} | null>(null);

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const qty = action.quantity ?? 1;
      const existingIndex = state.items.findIndex(
        (ci) => ci.product.id === action.product.id
      );
      if (existingIndex >= 0) {
        const newItems = [...state.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + qty,
        };
        return { items: newItems };
      }
      return { items: [...state.items, { product: action.product, quantity: qty }] };
    }
    case 'REMOVE':
      return { items: state.items.filter((ci) => ci.product.id !== action.productId) };
    case 'SET_QTY': {
      const newItems = state.items
        .map((ci) =>
          ci.product.id === action.productId ? { ...ci, quantity: action.quantity } : ci
        )
        .filter((ci) => ci.quantity > 0);
      return { items: newItems };
    }
    case 'CLEAR':
      return { items: [] };
    default:
      return state;
  }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  const value = useMemo(() => {
    const totalPrice = state.items.reduce((sum, ci) => sum + ci.product.price * ci.quantity, 0);
    return {
      items: state.items,
      addItem: (product: Product, quantity?: number) =>
        dispatch({ type: 'ADD', product, quantity }),
      removeItem: (productId: string) => dispatch({ type: 'REMOVE', productId }),
      setQuantity: (productId: string, quantity: number) =>
        dispatch({ type: 'SET_QTY', productId, quantity }),
      clear: () => dispatch({ type: 'CLEAR' }),
      totalPrice,
    };
  }, [state.items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}



