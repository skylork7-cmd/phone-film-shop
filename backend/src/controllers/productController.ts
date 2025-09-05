import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { Product } from '../types';

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const productsSnapshot = await db.collection('products').get();
    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];

    res.json(products);
  } catch (error) {
    console.error('상품 목록 조회 실패:', error);
    res.status(500).json({ message: '상품 목록 조회에 실패했습니다.' });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const productDoc = await db.collection('products').doc(id).get();

    if (!productDoc.exists) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    const product = {
      id: productDoc.id,
      ...productDoc.data()
    } as Product;

    res.json(product);
  } catch (error) {
    console.error('상품 조회 실패:', error);
    res.status(500).json({ message: '상품 조회에 실패했습니다.' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const productData: Omit<Product, 'id'> = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 필수 필드 검증
    if (!productData.name || !productData.description || !productData.price) {
      return res.status(400).json({ message: '필수 필드 누락: name, description, price' });
    }

    // 할인 로직 처리 (기간 조건 적용)
    if (productData.discountApplied === 'N') {
      productData.discountRate = 0;
      productData.discountedPrice = productData.price;
      productData.discountStartDate = '';
      productData.discountEndDate = '';
    } else if (productData.discountApplied === 'Y') {
      const hasValidRate = typeof productData.discountRate === 'number' && productData.discountRate > 0;
      const hasBothDates = Boolean(productData.discountStartDate) && Boolean(productData.discountEndDate);
      let isWithinRange = false;

      if (hasBothDates) {
        const now = new Date();
        const start = new Date(productData.discountStartDate as unknown as string);
        const end = new Date(productData.discountEndDate as unknown as string);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          isWithinRange = now >= start && now <= end;
        }
      }

      if (hasValidRate && isWithinRange) {
        productData.discountedPrice = Math.round(productData.price * (1 - (productData.discountRate as number) / 100));
      } else {
        // 기간이 아니거나 할인률이 없으면 할인 미적용
        productData.discountedPrice = productData.price;
      }
    }

    const docRef = await db.collection('products').add(productData);
    
    console.log('상품 생성 성공:', {
      id: docRef.id,
      name: productData.name,
      price: productData.price,
      discountedPrice: productData.discountedPrice,
      discountApplied: productData.discountApplied,
      discountRate: productData.discountRate
    });

    res.status(201).json({
      id: docRef.id,
      ...productData
    });
  } catch (error) {
    console.error('상품 생성 실패:', error);
    res.status(500).json({ message: '상품 생성에 실패했습니다.' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: Partial<Product> = {
      ...req.body,
      updatedAt: new Date()
    };

    // 할인 로직 처리 (기간 조건 적용)
    if (updateData.discountApplied === 'N') {
      updateData.discountRate = 0;
      updateData.discountedPrice = updateData.price;
      updateData.discountStartDate = '';
      updateData.discountEndDate = '';
    } else if (updateData.discountApplied === 'Y' && updateData.price) {
      const hasValidRate = typeof updateData.discountRate === 'number' && (updateData.discountRate as number) > 0;
      const hasBothDates = Boolean(updateData.discountStartDate) && Boolean(updateData.discountEndDate);
      let isWithinRange = false;

      if (hasBothDates) {
        const now = new Date();
        const start = new Date(updateData.discountStartDate as unknown as string);
        const end = new Date(updateData.discountEndDate as unknown as string);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          isWithinRange = now >= start && now <= end;
        }
      }

      if (hasValidRate && isWithinRange) {
        updateData.discountedPrice = Math.round((updateData.price as number) * (1 - (updateData.discountRate as number) / 100));
      } else {
        // 기간이 아니거나 할인률이 없으면 할인 미적용
        updateData.discountedPrice = updateData.price;
      }
    }

    // undefined 값 제거
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof Product] === undefined) {
        delete updateData[key as keyof Product];
      }
    });

    await db.collection('products').doc(id).set(updateData, { merge: true });

    console.log('상품 수정 성공:', {
      id,
      discountApplied: updateData.discountApplied,
      discountRate: updateData.discountRate,
      discountedPrice: updateData.discountedPrice
    });

    res.json({ message: '상품이 성공적으로 수정되었습니다.' });
  } catch (error) {
    console.error('상품 수정 실패:', error);
    res.status(500).json({ message: '상품 수정에 실패했습니다.' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.collection('products').doc(id).delete();
    
    res.json({ message: '상품이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('상품 삭제 실패:', error);
    res.status(500).json({ message: '상품 삭제에 실패했습니다.' });
  }
};