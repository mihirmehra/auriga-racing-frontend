'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { wishlistAPI, cartAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, Trash2, Star } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { toast } from 'sonner';

interface WishlistItem {
  product: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice?: number;
    images: Array<{ url: string; alt: string }>;
    category: { name: string; slug: string };
    rating: { average: number; count: number };
    inventory: { quantity: number; trackQuantity: boolean };
  };
  addedAt: string;
}

interface Wishlist {
  _id: string;
  items: WishlistItem[];
}

export default function WishlistPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    fetchWishlist();
  }, [user, router]);

  const fetchWishlist = async () => {
    try {
      const response = await wishlistAPI.get();
      setWishlist(response.data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    setActionLoading(productId);
    try {
      const response = await wishlistAPI.remove(productId);
      setWishlist(response.data.wishlist);
      toast.success('Item removed from wishlist');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove item');
    } finally {
      setActionLoading(null);
    }
  };

  const addToCart = async (productId: string) => {
    setActionLoading(productId);
    try {
      await cartAPI.add({ productId, quantity: 1 });
      toast.success('Item added to cart');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    } finally {
      setActionLoading(null);
    }
  };

  const moveToCart = async (productId: string) => {
    setActionLoading(productId);
    try {
      await wishlistAPI.moveToCart(productId);
      await fetchWishlist(); // Refresh wishlist
      toast.success('Item moved to cart');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to move to cart');
    } finally {
      setActionLoading(null);
    }
  };

  const clearWishlist = async () => {
    try {
      const response = await wishlistAPI.clear();
      setWishlist(response.data.wishlist);
      toast.success('Wishlist cleared');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to clear wishlist');
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">My Wishlist</h1>
          <p className="text-gray-600">
            {wishlist?.items.length || 0} {wishlist?.items.length === 1 ? 'item' : 'items'} saved for later
          </p>
        </div>

        {!wishlist || wishlist.items.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-8">
              Save items you love to your wishlist and shop them later.
            </p>
            <Link href="/products">
              <Button size="lg">
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Saved Items</h2>
              <Button variant="outline" size="sm" onClick={clearWishlist}>
                Clear Wishlist
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlist.items.map((item) => {
                const product = item.product;
                const discount = product.comparePrice 
                  ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
                  : 0;

                return (
                  <Card key={product._id} className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="relative overflow-hidden">
                      <img
                        src={product.images[0]?.url || 'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg'}
                        alt={product.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {discount > 0 && (
                        <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600">
                          {discount}% OFF
                        </Badge>
                      )}
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-2 right-2 rounded-full"
                        onClick={() => removeFromWishlist(product._id)}
                        disabled={actionLoading === product._id}
                      >
                        <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                      </Button>
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < Math.floor(product.rating.average)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-xs text-gray-500 ml-1">({product.rating.count})</span>
                      </div>
                      
                      <Link href={`/products/${product.slug}`}>
                        <h3 className="font-semibold text-sm mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      
                      <p className="text-xs text-gray-500 mb-2">{product.category.name}</p>
                      
                      <div className="flex items-center gap-2 mb-4">
                        <span className="font-bold text-lg">${product.price}</span>
                        {product.comparePrice && (
                          <span className="text-sm text-gray-500 line-through">
                            ${product.comparePrice}
                          </span>
                        )}
                      </div>

                      {product.inventory.trackQuantity && product.inventory.quantity === 0 ? (
                        <Badge variant="destructive" className="w-full justify-center">
                          Out of Stock
                        </Badge>
                      ) : (
                        <div className="space-y-2">
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => addToCart(product._id)}
                            disabled={actionLoading === product._id}
                          >
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            Add to Cart
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => moveToCart(product._id)}
                            disabled={actionLoading === product._id}
                          >
                            Move to Cart
                          </Button>
                        </div>
                      )}

                      {product.inventory.trackQuantity && product.inventory.quantity > 0 && (
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          {product.inventory.quantity} left in stock
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}