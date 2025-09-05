import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    isAdmin: boolean;
  };
}

export interface Product {
  id?: string;
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
  createdAt?: any;
  updatedAt?: any;
}

export interface Order {
  id?: string;
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
  createdAt?: any;
  updatedAt?: any;
}

export interface User {
  id?: string;
  email: string;
  displayName?: string;
  createdAt?: any;
  lastLoginAt?: any;
  isAdmin: boolean;
}
