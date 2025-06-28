'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { cartAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Minus, Plus, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { toast } from 'sonner';

interface CartItem {
  product: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    images: Array<{ url: string; alt: string }>;
    inventory: { quantity: number; trackQuantity: boolean };
  };
  quantity: number;
  price: number;
  addedAt: string;
}

interface Cart {
  _id: string;
  items: CartItem[];
  subtotal: number;
  total: number;
}

export default function CartPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    fetchCart();
  }, [user, router]);

  const fetchCart = async () => {
    try {
      const response = await cartAPI.get();
      setCart(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setUpdating(productId);
    try {
      const response = await cartAPI.update(productId, { quantity: newQuantity });
      setCart(response.data.cart);
      toast.success('Cart updated');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update cart');
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (productId: string) => {
    setUpdating(productId);
    try {
      const response = await cartAPI.remove(productId);
      setCart(response.data.cart);
      toast.success('Item removed from cart');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove item');
    } finally {
      setUpdating(null);
    }
  };

  const clearCart = async () => {
    try {
      const response = await cartAPI.clear();
      setCart(response.data.cart);
      toast.success('Cart cleared');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to clear cart');
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Shopping Cart</h1>
          <p className="text-gray-600">
            {cart?.items.length || 0} {cart?.items.length === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        {!cart || cart.items.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Link href="/products">
              <Button size="lg">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Cart Items</h2>
                <Button variant="outline" size="sm" onClick={clearCart}>
                  Clear Cart
                </Button>
              </div>

              {cart.items.map((item) => (
                <Card key={item.product._id}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <img
                          src={item.product.images[0]?.url || 'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg'}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${item.product.slug}`}>
                          <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                            {item.product.name}
                          </h3>
                        </Link>
                        <p className="text-gray-600 mt-1">${item.price} each</p>
                        
                        {item.product.inventory.trackQuantity && (
                          <p className="text-sm text-gray-500 mt-1">
                            {item.product.inventory.quantity} in stock
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || updating === item.product._id}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        
                        <span className="w-12 text-center font-medium">
                          {item.quantity}
                        </span>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                          disabled={
                            updating === item.product._id ||
                            (item.product.inventory.trackQuantity && 
                             item.quantity >= item.product.inventory.quantity)
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-semibold">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.product._id)}
                          disabled={updating === item.product._id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${cart.subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{cart.subtotal > 100 ? 'Free' : '$10.00'}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${(cart.subtotal * 0.08).toFixed(2)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>
                      ${(cart.subtotal + (cart.subtotal > 100 ? 0 : 10) + (cart.subtotal * 0.08)).toFixed(2)}
                    </span>
                  </div>

                  {cart.subtotal < 100 && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Add ${(100 - cart.subtotal).toFixed(2)} more for free shipping!
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Link href="/checkout">
                      <Button className="w-full" size="lg">
                        Proceed to Checkout
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    
                    <Link href="/products">
                      <Button variant="outline" className="w-full">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Continue Shopping
                      </Button>
                    </Link>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Badge variant="secondary">Secure</Badge>
                      <span>SSL encrypted checkout</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}