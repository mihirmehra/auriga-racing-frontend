'use client';

import { useState, useEffect } from 'react';
import { cartAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface CartItem {
  product: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    images: Array<{ url: string; alt: string }>;
  };
  quantity: number;
  price: number;
}

interface Cart {
  _id: string;
  items: CartItem[];
  subtotal: number;
  total: number;
}

export function useCart() {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [itemCount, setItemCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await cartAPI.get();
      setCart(response.data);
      setItemCount(response.data.items.reduce((total: number, item: CartItem) => total + item.quantity, 0));
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  return {
    cart,
    itemCount,
    loading,
    fetchCart,
  };
}