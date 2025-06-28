'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { categoriesAPI, productsAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Heart, Star, Filter, Grid, List } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  subCategories?: SubCategory[];
}

interface SubCategory {
  _id: string;
  name: string;
  slug: string;
  description: string;
}

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
}

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoryRes, productsRes] = await Promise.all([
          categoriesAPI.getBySlug(slug),
          productsAPI.getAll({ category: slug, sortBy, sortOrder })
        ]);

        setCategory(categoryRes.data);
        setProducts(productsRes.data.products);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, sortBy, sortOrder]);

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
          <Button size="sm" className="rounded-full">
            <ShoppingCart className="h-3 w-3 mr-1" />
            Add
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

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Category Not Found</h1>
          <p className="text-gray-600 mb-8">The category youre looking for doesnt exist.</p>
          <Link href="/categories">
            <Button>Browse All Categories</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Category Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-shrink-0">
              <img
                src={category.image || 'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg'}
                alt={category.name}
                className="w-24 h-24 rounded-lg object-cover"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{category.name}</h1>
              <p className="text-gray-600 mb-4">
                {category.description || `Discover our collection of ${category.name.toLowerCase()} products.`}
              </p>
              <div className="text-sm text-gray-500">
                {products.length} products found
              </div>
            </div>
          </div>

          {/* Subcategories */}
          {category.subCategories && category.subCategories.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Subcategories</h3>
              <div className="flex flex-wrap gap-2">
                {category.subCategories.map((subCategory) => (
                  <Link
                    key={subCategory._id}
                    href={`/categories/${category.slug}/${subCategory.slug}`}
                  >
                    <Badge variant="outline" className="hover:bg-blue-50 hover:border-blue-300 cursor-pointer">
                      {subCategory.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="createdAt">Newest</SelectItem>
                <SelectItem value="rating.average">Rating</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Filter className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">
              There are no products in this category yet. Check back later!
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}