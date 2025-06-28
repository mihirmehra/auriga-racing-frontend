'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { productsAPI, categoriesAPI, cartAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { ShoppingCart, Heart, Star, Search, Filter, Grid, List, X } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { toast } from 'sonner';

interface Product {
  _id: string;
  name: string;
  slug: string;
  currentPrice: number;
  originalPrice?: number;
  discountPercentage?: number;
  brand: string;
  images: Array<{ url: string; alt: string }>;
  category: { name: string; slug: string };
  rating: { average: number; count: number };
  isFeatured: boolean;
  inventory: { quantity: number; trackQuantity: boolean };
  keyAttributes: {
    size: string[];
    color: string[];
  };
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [categoriesRes, brandsRes, sizesRes, colorsRes] = await Promise.all([
          categoriesAPI.getAll(),
          productsAPI.getAll({ limit: 1 }).then(() => fetch('/api/products/filters/brands')),
          fetch('/api/products/filters/sizes'),
          fetch('/api/products/filters/colors')
        ]);

        setCategories(categoriesRes.data);
        
        // Handle brands, sizes, colors responses
        if (brandsRes.ok) {
          const brandsData = await brandsRes.json();
          setBrands(brandsData);
        }
        if (sizesRes.ok) {
          const sizesData = await sizesRes.json();
          setSizes(sizesData);
        }
        if (colorsRes.ok) {
          const colorsData = await colorsRes.json();
          setColors(colorsData);
        }
      } catch (error) {
        console.error('Error fetching filters:', error);
      }
    };

    fetchFilters();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params: any = {
          page: currentPage,
          limit: 12,
          sortBy,
          sortOrder,
        };

        if (searchQuery) params.search = searchQuery;
        if (selectedCategories.length > 0) params.category = selectedCategories[0];
        if (selectedBrands.length > 0) params.brand = selectedBrands[0];
        if (selectedSizes.length > 0) params.size = selectedSizes[0];
        if (selectedColors.length > 0) params.color = selectedColors[0];
        if (priceRange[0] > 0) params.minPrice = priceRange[0];
        if (priceRange[1] < 1000) params.maxPrice = priceRange[1];

        const response = await productsAPI.getAll(params);
        setProducts(response.data.products || []);
        setTotalPages(response.data.totalPages || 1);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, searchQuery, selectedCategories, selectedBrands, selectedSizes, selectedColors, priceRange, sortBy, sortOrder]);

  const handleFilterChange = (type: string, value: string, checked: boolean) => {
    switch (type) {
      case 'category':
        setSelectedCategories(checked ? [value] : []);
        break;
      case 'brand':
        setSelectedBrands(checked ? [value] : []);
        break;
      case 'size':
        setSelectedSizes(checked ? [value] : []);
        break;
      case 'color':
        setSelectedColors(checked ? [value] : []);
        break;
    }
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setPriceRange([0, 1000]);
    setCurrentPage(1);
  };

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
        {product.discountPercentage && product.discountPercentage > 0 && (
          <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600">
            {product.discountPercentage}% OFF
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
        <p className="text-xs text-gray-500 mb-2">{product.brand} • {product.category.name}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">${product.currentPrice}</span>
            {product.originalPrice && product.originalPrice > product.currentPrice && (
              <span className="text-sm text-gray-500 line-through">
                ${product.originalPrice}
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
            {product.inventory.trackQuantity && product.inventory.quantity === 0 ? 'Out of Stock' : 'Add'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">All Products</h1>
          <p className="text-gray-600">Discover our complete collection of quality products</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Filters</h3>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Search</label>
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
              </div>

              {/* Categories */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Categories</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {categories.map((category) => (
                    <div key={category._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={category._id}
                        checked={selectedCategories.includes(category._id)}
                        onCheckedChange={(checked) => 
                          handleFilterChange('category', category._id, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={category._id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {category.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Brands */}
              {brands.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Brands</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {brands.map((brand) => (
                      <div key={brand} className="flex items-center space-x-2">
                        <Checkbox
                          id={brand}
                          checked={selectedBrands.includes(brand)}
                          onCheckedChange={(checked) => 
                            handleFilterChange('brand', brand, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={brand}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {brand}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes */}
              {sizes.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Sizes</label>
                  <div className="grid grid-cols-3 gap-2">
                    {sizes.map((size) => (
                      <div key={size} className="flex items-center space-x-2">
                        <Checkbox
                          id={size}
                          checked={selectedSizes.includes(size)}
                          onCheckedChange={(checked) => 
                            handleFilterChange('size', size, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={size}
                          className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {size}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {colors.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Colors</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {colors.map((color) => (
                      <div key={color} className="flex items-center space-x-2">
                        <Checkbox
                          id={color}
                          checked={selectedColors.includes(color)}
                          onCheckedChange={(checked) => 
                            handleFilterChange('color', color, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={color}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {color}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Price Range: ${priceRange[0]} - ${priceRange[1]}
                </label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={1000}
                  step={10}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                
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
                    <SelectItem value="currentPrice">Price</SelectItem>
                    <SelectItem value="createdAt">Newest</SelectItem>
                    <SelectItem value="rating.average">Rating</SelectItem>
                    <SelectItem value="brand">Brand</SelectItem>
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

            {/* Active Filters */}
            {(selectedCategories.length > 0 || selectedBrands.length > 0 || selectedSizes.length > 0 || selectedColors.length > 0 || searchQuery || priceRange[0] > 0 || priceRange[1] < 1000) && (
              <div className="flex flex-wrap gap-2 mb-6">
                {searchQuery && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Search: {searchQuery}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                  </Badge>
                )}
                {selectedCategories.map((categoryId) => {
                  const category = categories.find(c => c._id === categoryId);
                  return category ? (
                    <Badge key={categoryId} variant="secondary" className="flex items-center gap-1">
                      {category.name}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleFilterChange('category', categoryId, false)} 
                      />
                    </Badge>
                  ) : null;
                })}
                {selectedBrands.map((brand) => (
                  <Badge key={brand} variant="secondary" className="flex items-center gap-1">
                    {brand}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleFilterChange('brand', brand, false)} 
                    />
                  </Badge>
                ))}
                {selectedSizes.map((size) => (
                  <Badge key={size} variant="secondary" className="flex items-center gap-1">
                    Size: {size}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleFilterChange('size', size, false)} 
                    />
                  </Badge>
                ))}
                {selectedColors.map((color) => (
                  <Badge key={color} variant="secondary" className="flex items-center gap-1">
                    Color: {color}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleFilterChange('color', color, false)} 
                    />
                  </Badge>
                ))}
                {(priceRange[0] > 0 || priceRange[1] < 1000) && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    ${priceRange[0]} - ${priceRange[1]}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setPriceRange([0, 1000])} 
                    />
                  </Badge>
                )}
              </div>
            )}

            {/* Products */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : products.length > 0 ? (
              <>
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
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
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600">
                  Try adjusting your search criteria or browse our categories.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}