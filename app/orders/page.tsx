'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { ordersAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Eye, Calendar, DollarSign } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface Order {
  _id: string;
  orderNumber: string;
  items: Array<{
    product: {
      _id: string;
      name: string;
      slug: string;
      images: Array<{ url: string; alt: string }>;
    };
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
  createdAt: string;
  deliveredAt?: string;
  trackingNumber?: string;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    fetchOrders();
  }, [user, router, statusFilter, currentPage]);

  const fetchOrders = async () => {
    try {
      const params: any = {
        page: currentPage,
        limit: 10,
      };

      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await ordersAPI.getMyOrders(params);
      setOrders(response.data.orders);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching orders:', error);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">My Orders</h1>
          <p className="text-gray-600">Track and manage your orders</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No orders found</h2>
            <p className="text-gray-600 mb-8">
              {statusFilter !== 'all' ? 'No orders match your filter criteria.' : "You haven't placed any orders yet."}
            </p>
            <Link href="/products">
              <Button size="lg">Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order._id}>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            ${order.total.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                        <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                          {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                        </Badge>
                        <Link href={`/orders/${order._id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {order.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <img
                            src={item.image || item.product?.images?.[0]?.url || 'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg'}
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            <p className="text-sm text-gray-500">
                              ${item.price} × {item.quantity}
                            </p>
                          </div>
                          <p className="text-sm font-medium">${item.total.toFixed(2)}</p>
                        </div>
                      ))}
                      
                      {order.items.length > 3 && (
                        <p className="text-sm text-gray-500 text-center">
                          +{order.items.length - 3} more items
                        </p>
                      )}
                    </div>

                    {order.trackingNumber && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900">
                          Tracking Number: {order.trackingNumber}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <Button
                      key={i + 1}
                      variant={currentPage === i + 1 ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}