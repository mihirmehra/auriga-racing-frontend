'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { usersAPI, productsAPI, ordersAPI, reviewsAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  Plus,
  Star,
  Clock,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalReviews: number;
  pendingOrders: number;
  recentOrders: any[];
  topProducts: any[];
  recentReviews: any[];
}

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalReviews: 0,
    pendingOrders: 0,
    recentOrders: [],
    topProducts: [],
    recentReviews: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }

    fetchDashboardData();
  }, [isAdmin, router]);

  const fetchDashboardData = async () => {
    try {
      const [usersRes, productsRes, ordersRes, reviewsRes] = await Promise.all([
        usersAPI.getAll({ limit: 1 }),
        productsAPI.getAll({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
        ordersAPI.getAll({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
        reviewsAPI.getAll({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })
      ]);

      // Calculate revenue from orders
      const allOrdersRes = await ordersAPI.getAll({ limit: 1000 });
      const totalRevenue = allOrdersRes.data.orders.reduce((sum: number, order: any) => sum + order.total, 0);
      const pendingOrders = allOrdersRes.data.orders.filter((order: any) => order.status === 'pending').length;

      setStats({
        totalUsers: usersRes.data.total,
        totalProducts: productsRes.data.total,
        totalOrders: allOrdersRes.data.total,
        totalRevenue,
        totalReviews: reviewsRes.data.total,
        pendingOrders,
        recentOrders: ordersRes.data.orders.slice(0, 5),
        topProducts: productsRes.data.products.slice(0, 5),
        recentReviews: reviewsRes.data.reviews.slice(0, 5),
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = "text-muted-foreground" }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            {trend === 'up' ? (
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
            )}
            {trendValue}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );

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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.firstName}!</p>
          </div>
          <div className="flex space-x-2">
            <Button asChild>
              <Link href="/admin/products">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon={Users}
            trend="up"
            trendValue={12}
            color="text-blue-600"
          />
          <StatCard
            title="Total Products"
            value={stats.totalProducts.toLocaleString()}
            icon={Package}
            trend="up"
            trendValue={8}
            color="text-green-600"
          />
          <StatCard
            title="Total Orders"
            value={stats.totalOrders.toLocaleString()}
            icon={ShoppingCart}
            trend="up"
            trendValue={15}
            color="text-purple-600"
          />
          <StatCard
            title="Total Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            trend="up"
            trendValue={23}
            color="text-yellow-600"
          />
          <StatCard
            title="Total Reviews"
            value={stats.totalReviews.toLocaleString()}
            icon={Star}
            trend="up"
            trendValue={18}
            color="text-orange-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest customer orders</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/orders">
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentOrders.length > 0 ? (
                  stats.recentOrders.map((order: any) => (
                    <div key={order._id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{order.orderNumber}</p>
                        <p className="text-sm text-gray-500">
                          {order.user?.firstName} {order.user?.lastName} - ${order.total.toFixed(2)}
                        </p>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No orders yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Reviews */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Reviews</CardTitle>
                <CardDescription>Latest customer feedback</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/reviews">
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentReviews.length > 0 ? (
                  stats.recentReviews.map((review: any) => (
                    <div key={review._id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex">{getRatingStars(review.rating)}</div>
                          <span className="text-sm text-gray-600">
                            {review.user?.firstName} {review.user?.lastName}
                          </span>
                        </div>
                        <Badge variant={review.isApproved ? 'default' : 'secondary'}>
                          {review.isApproved ? 'Approved' : 'Pending'}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{review.title}</p>
                      <p className="text-sm text-gray-600 line-clamp-2">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No reviews yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Products</CardTitle>
              <CardDescription>Latest products added to the store</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/products">
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topProducts.length > 0 ? (
                stats.topProducts.map((product: any, index: number) => (
                  <div key={product._id} className="flex items-center space-x-4">
                    <img
                      src={product.images[0]?.url || 'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg'}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-500">${product.price}</p>
                    </div>
                    <Badge variant={product.isActive ? 'default' : 'secondary'}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No products yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col" asChild>
                <Link href="/admin/products">
                  <Package className="h-6 w-6 mb-2" />
                  Manage Products
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col" asChild>
                <Link href="/admin/orders">
                  <ShoppingCart className="h-6 w-6 mb-2" />
                  View Orders
                  {stats.pendingOrders > 0 && (
                    <Badge className="mt-1">{stats.pendingOrders} pending</Badge>
                  )}
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col" asChild>
                <Link href="/admin/users">
                  <Users className="h-6 w-6 mb-2" />
                  Manage Users
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col" asChild>
                <Link href="/admin/reviews">
                  <Star className="h-6 w-6 mb-2" />
                  Review Management
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}