'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { ordersAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  Truck, 
  MapPin, 
  CreditCard, 
  Calendar,
  ArrowLeft,
  Download,
  Phone,
  Mail
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface Order {
  _id: string;
  orderNumber: string;
  user: { _id: string; firstName: string; lastName: string; email: string };
  items: Array<{
    product: { _id: string; name: string; slug: string; images: Array<{ url: string; alt: string }> };
    name: string;
    image: string;
    price: number;
    quantity: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  deliveredAt?: string;
}

export default function OrderDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    fetchOrder();
  }, [user, router, params.id]);

  const fetchOrder = async () => {
    try {
      const response = await ordersAPI.getById(params.id as string);
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-8">The order you're looking for doesn't exist or you don't have permission to view it.</p>
          <Link href="/orders">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link href="/orders">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Orders
              </Button>
            </Link>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download Invoice
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
              <p className="text-gray-600">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(order.status)}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
              <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                      <img
                        src={item.image || item.product?.images?.[0]?.url || 'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg'}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-500">
                          ${item.price} × {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${item.total.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="font-medium">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </p>
                  <p>{order.shippingAddress.address1}</p>
                  {order.shippingAddress.address2 && (
                    <p>{order.shippingAddress.address2}</p>
                  )}
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                  {order.shippingAddress.phone && (
                    <p className="flex items-center gap-2 mt-2">
                      <Phone className="h-4 w-4" />
                      {order.shippingAddress.phone}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tracking Information */}
            {order.trackingNumber && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Tracking Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="font-medium text-blue-900">Tracking Number</p>
                    <p className="text-blue-800 font-mono">{order.trackingNumber}</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Track Package
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>${order.shipping.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Payment Method</span>
                    <span className="capitalize">{order.paymentMethod.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Status</span>
                    <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                      {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Order Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <div>
                      <p className="font-medium">Order Placed</p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {order.status !== 'pending' && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <div>
                        <p className="font-medium">Order Confirmed</p>
                        <p className="text-sm text-gray-500">Processing started</p>
                      </div>
                    </div>
                  )}
                  
                  {['shipped', 'delivered'].includes(order.status) && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <div>
                        <p className="font-medium">Order Shipped</p>
                        <p className="text-sm text-gray-500">On its way to you</p>
                      </div>
                    </div>
                  )}
                  
                  {order.status === 'delivered' && order.deliveredAt && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <div>
                        <p className="font-medium">Order Delivered</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.deliveredAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    If you have any questions about your order, feel free to contact us.
                  </p>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Mail className="mr-2 h-4 w-4" />
                      Email Support
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Phone className="mr-2 h-4 w-4" />
                      Call Support
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}