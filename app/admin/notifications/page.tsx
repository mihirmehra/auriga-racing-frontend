'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { notificationsAPI, usersAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Bell, 
  Plus, 
  Send, 
  Search,
  Users,
  MessageSquare,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { toast } from 'sonner';

interface Notification {
  _id: string;
  user: { _id: string; firstName: string; lastName: string; email: string };
  title: string;
  message: string;
  type: string;
  priority: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
}

export default function AdminNotificationsPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [broadcastDialogOpen, setBroadcastDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    users: [] as string[],
    title: '',
    message: '',
    type: 'system',
    priority: 'medium'
  });

  const [broadcastData, setBroadcastData] = useState({
    title: '',
    message: '',
    type: 'system',
    priority: 'medium'
  });

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }

    fetchNotifications();
    fetchUsers();
  }, [isAdmin, router, currentPage, typeFilter, priorityFilter]);

  const fetchNotifications = async () => {
    try {
      const params: any = {
        page: currentPage,
        limit: 10
      };

      const response = await notificationsAPI.getAll(params);
      setNotifications(response.data.notifications);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAll({ limit: 100 });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      users: [],
      title: '',
      message: '',
      type: 'system',
      priority: 'medium'
    });
  };

  const resetBroadcastForm = () => {
    setBroadcastData({
      title: '',
      message: '',
      type: 'system',
      priority: 'medium'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await notificationsAPI.create(formData);
      toast.success('Notifications sent successfully');
      setDialogOpen(false);
      resetForm();
      fetchNotifications();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send notifications');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await notificationsAPI.broadcast(broadcastData);
      toast.success('Broadcast notification sent successfully');
      setBroadcastDialogOpen(false);
      resetBroadcastForm();
      fetchNotifications();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send broadcast');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, users: [...formData.users, userId] });
    } else {
      setFormData({ ...formData, users: formData.users.filter(id => id !== userId) });
    }
  };

  const selectAllUsers = () => {
    setFormData({ ...formData, users: users.map(user => user._id) });
  };

  const clearUserSelection = () => {
    setFormData({ ...formData, users: [] });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <MessageSquare className="h-4 w-4" />;
      case 'product':
        return <Info className="h-4 w-4" />;
      case 'promotion':
        return <CheckCircle className="h-4 w-4" />;
      case 'system':
        return <AlertCircle className="h-4 w-4" />;
      case 'account':
        return <Users className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = !searchQuery || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.user.lastName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || notification.priority === priorityFilter;

    return matchesSearch && matchesType && matchesPriority;
  });

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600">Send and manage user notifications</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Send Notification
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Send Notification</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Select Users</Label>
                    <div className="flex gap-2 mb-2">
                      <Button type="button" variant="outline" size="sm" onClick={selectAllUsers}>
                        Select All
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={clearUserSelection}>
                        Clear All
                      </Button>
                    </div>
                    <div className="max-h-40 overflow-y-auto border rounded-lg p-3 space-y-2">
                      {users.map((user) => (
                        <div key={user._id} className="flex items-center space-x-2">
                          <Checkbox
                            id={user._id}
                            checked={formData.users.includes(user._id)}
                            onCheckedChange={(checked) => handleUserSelection(user._id, checked as boolean)}
                          />
                          <Label htmlFor={user._id} className="text-sm">
                            {user.firstName} {user.lastName} ({user.email})
                          </Label>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {formData.users.length} users selected
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="order">Order</SelectItem>
                          <SelectItem value="product">Product</SelectItem>
                          <SelectItem value="promotion">Promotion</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                          <SelectItem value="account">Account</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={submitting || formData.users.length === 0}>
                      <Send className="mr-2 h-4 w-4" />
                      {submitting ? 'Sending...' : 'Send Notification'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={broadcastDialogOpen} onOpenChange={setBroadcastDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={resetBroadcastForm}>
                  <Users className="mr-2 h-4 w-4" />
                  Broadcast
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Broadcast Notification</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleBroadcast} className="space-y-4">
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      This will send the notification to all active users.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="broadcastTitle">Title</Label>
                    <Input
                      id="broadcastTitle"
                      value={broadcastData.title}
                      onChange={(e) => setBroadcastData({ ...broadcastData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="broadcastMessage">Message</Label>
                    <Textarea
                      id="broadcastMessage"
                      value={broadcastData.message}
                      onChange={(e) => setBroadcastData({ ...broadcastData, message: e.target.value })}
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="broadcastType">Type</Label>
                      <Select value={broadcastData.type} onValueChange={(value) => setBroadcastData({ ...broadcastData, type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="order">Order</SelectItem>
                          <SelectItem value="product">Product</SelectItem>
                          <SelectItem value="promotion">Promotion</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                          <SelectItem value="account">Account</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="broadcastPriority">Priority</Label>
                      <Select value={broadcastData.priority} onValueChange={(value) => setBroadcastData({ ...broadcastData, priority: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={submitting}>
                      <Send className="mr-2 h-4 w-4" />
                      {submitting ? 'Broadcasting...' : 'Send Broadcast'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setBroadcastDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Bell className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Sent</p>
                  <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Read</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {notifications.filter(n => n.isRead).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Unread</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {notifications.filter(n => !n.isRead).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Urgent</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {notifications.filter(n => n.priority === 'urgent').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => {
                setSearchQuery('');
                setTypeFilter('all');
                setPriorityFilter('all');
                setCurrentPage(1);
              }}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Sent Notifications ({filteredNotifications.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Notification</th>
                    <th className="text-left p-4">Recipient</th>
                    <th className="text-left p-4">Type</th>
                    <th className="text-left p-4">Priority</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNotifications.map((notification) => (
                    <tr key={notification._id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{notification.title}</div>
                          <div className="text-sm text-gray-500 line-clamp-2">
                            {notification.message}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">
                            {notification.user.firstName} {notification.user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{notification.user.email}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          {getTypeIcon(notification.type)}
                          {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={getPriorityColor(notification.priority)}>
                          {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={notification.isRead ? 'default' : 'secondary'}>
                          {notification.isRead ? 'Read' : 'Unread'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
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
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}