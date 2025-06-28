'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { useCart } from '@/lib/hooks/useCart';
import { useWishlist } from '@/lib/hooks/useWishlist';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Bell,
  Menu,
  X,
  LogOut,
  Settings,
  Package,
  Shield,
  Check,
  CheckCheck,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { itemCount: cartItemCount } = useCart();
  const { itemCount: wishlistItemCount } = useWishlist();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirect to search results
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="h-4 w-4" />;
      case 'product':
        return <Package className="h-4 w-4" />;
      case 'promotion':
        return <Bell className="h-4 w-4" />;
      case 'system':
        return <Settings className="h-4 w-4" />;
      case 'account':
        return <User className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-blue-600';
      case 'low':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="hidden lg:flex items-center justify-between py-2 text-sm text-gray-600 border-b border-gray-100">
          <div className="flex items-center space-x-6">
            <span>Free shipping on orders over $100</span>
            <span>•</span>
            <span>Support: support@store.com</span>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <span>Welcome, {user.firstName}!</span>
            ) : (
              <>
                <Link href="/auth/login" className="hover:text-blue-600">
                  Sign In
                </Link>
                <span>•</span>
                <Link href="/auth/register" className="hover:text-blue-600">
                  Register
                </Link>
                <span>•</span>
                <Link href="/admin/auth/login" className="hover:text-blue-600 flex items-center">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Main navigation */}
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Auriga Racing
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Categories</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid gap-3 p-6 w-[400px] lg:w-[500px] lg:grid-cols-2">
                      <div className="row-span-3">
                        <NavigationMenuLink asChild>
                          <a
                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-blue-500 to-blue-600 p-6 no-underline outline-none focus:shadow-md"
                            href="/categories"
                          >
                            <div className="mb-2 mt-4 text-lg font-medium text-white">
                              All Categories
                            </div>
                            <p className="text-sm leading-tight text-blue-100">
                              Explore our complete collection
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </div>
                      <Link href="/categories/electronics" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                        Electronics
                      </Link>
                      <Link href="/categories/clothing" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                        Clothing
                      </Link>
                      <Link href="/categories/home" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                        Home & Garden
                      </Link>
                      <Link href="/categories/sports" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                        Sports
                      </Link>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <Link href="/products" className="text-gray-700 hover:text-blue-600 font-medium">
              Products
            </Link>
            <Link href="/deals" className="text-gray-700 hover:text-blue-600 font-medium">
              Deals
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-blue-600 font-medium">
              About
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-blue-600 font-medium">
              Contact
            </Link>
          </div>

          {/* Search bar */}
          <div className="hidden lg:flex flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4"
                />
              </div>
            </form>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {user && (
              <>
                {/* Notifications */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Notifications</h4>
                        {unreadCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                            className="text-xs"
                          >
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Mark all read
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.slice(0, 5).map((notification) => (
                          <div
                            key={notification._id}
                            className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                              !notification.isRead ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => !notification.isRead && markAsRead(notification._id)}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`mt-1 ${getPriorityColor(notification.priority)}`}>
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                                    {notification.title}
                                  </p>
                                  {!notification.isRead && (
                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(notification.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No notifications yet</p>
                        </div>
                      )}
                    </div>
                    {notifications.length > 5 && (
                      <div className="p-4 border-t">
                        <Link href="/notifications">
                          <Button variant="outline" size="sm" className="w-full">
                            View all notifications
                          </Button>
                        </Link>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>

                {/* Wishlist */}
                <Link href="/wishlist">
                  <Button variant="ghost" size="icon" className="relative">
                    <Heart className="h-5 w-5" />
                    {wishlistItemCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                        {wishlistItemCount > 99 ? '99+' : wishlistItemCount}
                      </Badge>
                    )}
                  </Button>
                </Link>

                {/* Cart */}
                <Link href="/cart">
                  <Button variant="ghost" size="icon" className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {cartItemCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                        {cartItemCount > 99 ? '99+' : cartItemCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
              </>
            )}

            {/* User menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    {user.firstName} {user.lastName}
                    {isAdmin && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Admin
                      </Badge>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders">
                      <Package className="mr-2 h-4 w-4" />
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/addresses">
                      <Package className="mr-2 h-4 w-4" />
                      My Addresses
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">
                    Register
                  </Button>
                </Link>
                <Link href="/admin/auth/login">
                  <Button variant="outline" size="sm" className="hidden sm:flex">
                    <Shield className="h-3 w-3 mr-1" />
                    Admin
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200">
            <div className="space-y-4">
              {/* Mobile search */}
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </form>

              {/* Mobile navigation links */}
              <div className="space-y-2">
                <Link
                  href="/categories"
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Categories
                </Link>
                <Link
                  href="/products"
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Products
                </Link>
                <Link
                  href="/deals"
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Deals
                </Link>
                <Link
                  href="/about"
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </Link>
                {!user && (
                  <Link
                    href="/admin/auth/login"
                    className="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Login
                  </Link>
                )}
              </div>

              {/* Mobile user actions */}
              {user && (
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <Link
                    href="/wishlist"
                    className="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Heart className="mr-3 h-4 w-4" />
                    Wishlist
                    {wishlistItemCount > 0 && (
                      <Badge className="ml-auto">
                        {wishlistItemCount}
                      </Badge>
                    )}
                  </Link>
                  <Link
                    href="/cart"
                    className="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <ShoppingCart className="mr-3 h-4 w-4" />
                    Cart
                    {cartItemCount > 0 && (
                      <Badge className="ml-auto">
                        {cartItemCount}
                      </Badge>
                    )}
                  </Link>
                  <Link
                    href="/orders"
                    className="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Package className="mr-3 h-4 w-4" />
                    Orders
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Shield className="mr-3 h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}