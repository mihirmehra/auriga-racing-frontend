'use client';

import { useState, useEffect } from 'react';
import { wishlistAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface WishlistItem {
  product: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    images: Array<{ url: string; alt: string }>;
  };
  addedAt: string;
}

interface Wishlist {
  _id: string;
  items: WishlistItem[];
}

export function useWishlist() {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [itemCount, setItemCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await wishlistAPI.get();
      setWishlist(response.data);
      setItemCount(response.data.items.length);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [user]);

  return {
    wishlist,
    itemCount,
    loading,
    fetchWishlist,
  };
}