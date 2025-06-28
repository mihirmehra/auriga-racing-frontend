'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { notificationsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Package, 
  Settings, 
  User, 
  AlertCircle,
  Info
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { toast } from 'sonner';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    fetchNotifications();
  }, [user, router, typeFilter, statusFilter, currentPage]);

  const fetchNotifications = async () => {
    try {
      const params: any = {
        page: currentPage,
        limit: 10,
      };

      if (statusFilter === 'unread') {
        params.unreadOnly = true;
      }

      const response = await notificationsAPI.getAll(params);
      setNotifications(response.data.notifications);
      setTotalPages(response.data.totalPages);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === id ? { ...notif, isRead: true, readAt: new Date().toISOString() } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Notification marked as read');
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await notificationsAPI.delete(id);
      setNotifications(prev => prev.filter(notif => notif._id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="h-5 w-5" />;
      case 'product':
        return <Package className="h-5 w-5" />;
      case 'promotion':
        return <Bell className="h-5 w-5" />;
      case 'system':
        return <Settings className="h-5 w-5" />;
      case 'account':
        return <User className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-blue-600 bg-blue-50';
      case 'low':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'order':
        return 'bg-green-100 text-green-800';
      case 'product':
        return 'bg-blue-100 text-blue-800';
      case 'promotion':
        return 'bg-purple-100 text-purple-800';
      case 'system':
        return 'bg-gray-100 text-gray-800';
      case 'account':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'read' && notification.isRead) ||
      (statusFilter === 'unread' && !notification.isRead);
    
    return matchesType && matchesStatus;
  });

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
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} variant="outline">
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark all as read ({unreadCount})
              </Button>
            )}
          </div>
          <p className="text-gray-600">Stay updated with your latest notifications</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="order">Orders</SelectItem>
              <SelectItem value="product">Products</SelectItem>
              <SelectItem value="promotion">Promotions</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="account">Account</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Notifications</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No notifications found</h2>
            <p className="text-gray-600">
              {typeFilter !== 'all' || statusFilter !== 'all' 
                ? 'No notifications match your filter criteria.' 
                : "You don't have any notifications yet."}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <Card 
                  key={notification._id} 
                  className={`transition-all duration-200 hover:shadow-md ${
                    !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-full ${getPriorityColor(notification.priority)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className={`text-lg font-semibold ${
                                !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </h3>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                            </div>
                            
                            <p className="text-gray-600 mb-3 leading-relaxed">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center gap-3 text-sm">
                              <Badge className={getTypeColor(notification.type)}>
                                {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                              </Badge>
                              
                              <Badge variant="outline" className={
                                notification.priority === 'urgent' ? 'border-red-300 text-red-700' :
                                notification.priority === 'high' ? 'border-orange-300 text-orange-700' :
                                notification.priority === 'medium' ? 'border-blue-300 text-blue-700' :
                                'border-gray-300 text-gray-700'
                              }>
                                {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)} Priority
                              </Badge>
                              
                              <span className="text-gray-500">
                                {new Date(notification.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              
                              {notification.isRead && notification.readAt && (
                                <span className="text-gray-400 text-xs">
                                  Read {new Date(notification.readAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification._id)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification._id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
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