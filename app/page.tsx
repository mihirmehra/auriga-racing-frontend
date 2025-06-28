'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { productsAPI, categoriesAPI, cartAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Heart, Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { toast } from 'sonner';

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  images: Array<{ url: string; alt: string }>;
  category: { name: string; slug: string };
  rating: { average: number; count: number };
  isFeatured: boolean;
  inventory: { quantity: number; trackQuantity: boolean };
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
}

export default function HomePage() {
  const { user } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, latestRes, categoriesRes] = await Promise.all([
          productsAPI.getAll({ featured: true, limit: 8 }),
          productsAPI.getAll({ limit: 8, sortBy: 'createdAt', sortOrder: 'desc' }),
          categoriesAPI.getAll()
        ]);

        setFeaturedProducts(featuredRes.data.products || []);
        setLatestProducts(latestRes.data.products || []);
        setCategories(categoriesRes.data.slice(0, 6) || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddToCart = async (productId: string) => {
    try {
      await cartAPI.add({ productId, quantity: 1 });
      toast.success('Product added to cart!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    }
  };

  const ProductCard = ({ product }: { product: Product }) => (
    <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative overflow-hidden">
        <img
          src={product.images[0]?.url || 'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg'}
          alt={product.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.comparePrice && (
          <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600">
            {Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}% OFF
          </Badge>
        )}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button size="icon" variant="secondary" className="rounded-full">
            <Heart className="h-4 w-4" />
          </Button>
        </div>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">${product.price}</span>
            {product.comparePrice && (
              <span className="text-sm text-gray-500 line-through">
                ${product.comparePrice}
              </span>
            )}
          </div>
          <Button 
            size="sm" 
            className="rounded-full"
            onClick={() => handleAddToCart(product._id)}
            disabled={product.inventory.trackQuantity && product.inventory.quantity === 0}
          >
            <ShoppingCart className="h-3 w-3 mr-1" />
            {product.inventory.trackQuantity && product.inventory.quantity === 0 ? 'Out' : 'Add'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

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
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to Our Store
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Discover amazing products at unbeatable prices
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  Shop Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/categories">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                  Browse Categories
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Shop by Category</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Explore our wide range of categories to find exactly what you re looking for
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {categories.map((category) => (
                <Link
                  key={category._id}
                  href={`/categories/${category.slug}`}
                  className="group"
                >
                  <Card className="text-center hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-6">
                      <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <img
                          src={category.image || 'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg'}
                          alt={category.name}
                          className="w-8 h-8 object-cover rounded-full"
                        />
                      </div>
                      <h3 className="font-semibold text-sm">{category.name}</h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
                <p className="text-gray-600">Hand-picked products just for you</p>
              </div>
              <Link href="/products">
                <Button variant="outline">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Products */}
      {latestProducts.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Latest Arrivals</h2>
                <p className="text-gray-600">Check out our newest additions</p>
              </div>
              <Link href="/products">
                <Button variant="outline">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {latestProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-xl mb-8 text-blue-100">
            Subscribe to our newsletter and get 10% off your first order
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <Button className="bg-white text-blue-600 hover:bg-gray-100">
              Subscribe
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}