export type CurrencyCode = 'KRW' | 'USD';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // price in smallest unit (KRW won)
  currency: CurrencyCode;
  imageUrl: string;
  compatibility: string[]; // e.g., ['iPhone 15', 'Galaxy S24']
  stock: number;
  discountRate?: number;
  discountedPrice?: number;
  discountApplied?: string;
  discountStartDate?: string;
  discountEndDate?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}



