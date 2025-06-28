'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { productsAPI, categoriesAPI } from '@/lib/api';
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
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Eye,
  Star,
  DollarSign,
  Archive,
  X
} from 'lucide-react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { toast } from 'sonner';

interface Product {
  _id: string;
  name: string;
  description: string,
  shortDescription: string,
  sku: string,
  slug: string;
  currentPrice: number;
  originalPrice?: number;
  discountPercentage?: number;
  brand: string;
  category: { _id: string; name: string; slug: string };
  images: Array<{ url: string; alt: string; isPrimary: boolean }>;
  inventory: { quantity: number; trackQuantity: boolean };
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  keyAttributes: {
    size: string[];
    color: string[];
  };
  features: string[];
  rating: { average: number; count: number };
  createdAt: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

export default function AdminProductsPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    sku: '',
    currentPrice: 0,
    originalPrice: 0,
    brand: '',
    category: '',
    images: [{ url: '', alt: '', isPrimary: true }],
    inventory: { quantity: 0, trackQuantity: true },
    isActive: true,
    isFeatured: false,
    tags: '',
    weight: 0,
    dimensions: { length: 0, width: 0, height: 0 },
    attributes: [{ name: '', value: '' }],
    variants: [{ name: '', options: [''], price: 0 }],
    keyAttributes: {
      size: ['M', 'L', 'XL'],
      color: ['Black', 'White']
    },
    features: ['High Quality', 'Durable', 'Comfortable']
  });

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }

    fetchProducts();
    fetchCategories();
  }, [isAdmin, router, currentPage, searchQuery, categoryFilter, statusFilter]);

  const fetchProducts = async () => {
    try {
      const params: any = {
        page: currentPage,
        limit: 10,
        includeInactive: true
      };

      if (searchQuery) params.search = searchQuery;
      if (categoryFilter && categoryFilter !== 'all') params.category = categoryFilter;
      if (statusFilter === 'active') params.isActive = true;
      if (statusFilter === 'inactive') params.isActive = false;

      const response = await productsAPI.getAll(params);
      setProducts(response.data.products);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      shortDescription: '',
      sku: '',
      currentPrice: 0,
      originalPrice: 0,
      brand: '',
      category: '',
      images: [{ url: '', alt: '', isPrimary: true }],
      inventory: { quantity: 0, trackQuantity: true },
      isActive: true,
      isFeatured: false,
      tags: '',
      weight: 0,
      dimensions: { length: 0, width: 0, height: 0 },
      attributes: [{ name: '', value: '' }],
      variants: [{ name: '', options: [''], price: 0 }],
      keyAttributes: {
        size: ['M', 'L', 'XL'],
        color: ['Black', 'White']
      },
      features: ['High Quality', 'Durable', 'Comfortable']
    });
    setEditingProduct(null);
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description || '',
      shortDescription: product.shortDescription || '',
      sku: product.sku,
      currentPrice: product.currentPrice,
      originalPrice: product.originalPrice || 0,
      brand: product.brand,
      category: product.category._id,
      images: product.images.length > 0 ? product.images : [{ url: '', alt: '', isPrimary: true }],
      inventory: product.inventory,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      tags: product.tags.join(', '),
      weight: 0,
      dimensions: { length: 0, width: 0, height: 0 },
      attributes: [{ name: '', value: '' }],
      variants: [{ name: '', options: [''], price: 0 }],
      keyAttributes: product.keyAttributes || {
        size: ['M', 'L', 'XL'],
        color: ['Black', 'White']
      },
      features: product.features || ['High Quality', 'Durable', 'Comfortable']
    });
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.description || !formData.sku || !formData.currentPrice || !formData.category || !formData.brand) {
        toast.error('Please fill in all required fields');
        setSubmitting(false);
        return;
      }

      const productData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        attributes: formData.attributes.filter(attr => attr.name && attr.value),
        variants: formData.variants.filter(variant => variant.name && variant.options.length > 0)
      };

      if (editingProduct) {
        const response = await productsAPI.update(editingProduct._id, productData);
        setProducts(products.map(product => 
          product._id === editingProduct._id ? response.data.product : product
        ));
        toast.success('Product updated successfully');
      } else {
        const response = await productsAPI.create(productData);
        setProducts([response.data.product, ...products]);
        toast.success('Product created successfully');
      }
      
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await productsAPI.delete(productId);
      setProducts(products.filter(product => product._id !== productId));
      toast.success('Product deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
  };

  const addImageField = () => {
    setFormData({
      ...formData,
      images: [...formData.images, { url: '', alt: '', isPrimary: false }]
    });
  };

  const removeImageField = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
  };

  const updateImage = (index: number, field: string, value: string | boolean) => {
    const newImages = formData.images.map((img, i) => 
      i === index ? { ...img, [field]: value } : img
    );
    setFormData({ ...formData, images: newImages });
  };

  const addSizeOption = () => {
    setFormData({
      ...formData,
      keyAttributes: {
        ...formData.keyAttributes,
        size: [...formData.keyAttributes.size, '']
      }
    });
  };

  const removeSizeOption = (index: number) => {
    const newSizes = formData.keyAttributes.size.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      keyAttributes: {
        ...formData.keyAttributes,
        size: newSizes
      }
    });
  };

  const updateSizeOption = (index: number, value: string) => {
    const newSizes = formData.keyAttributes.size.map((size, i) => 
      i === index ? value : size
    );
    setFormData({
      ...formData,
      keyAttributes: {
        ...formData.keyAttributes,
        size: newSizes
      }
    });
  };

  const addColorOption = () => {
    setFormData({
      ...formData,
      keyAttributes: {
        ...formData.keyAttributes,
        color: [...formData.keyAttributes.color, '']
      }
    });
  };

  const removeColorOption = (index: number) => {
    const newColors = formData.keyAttributes.color.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      keyAttributes: {
        ...formData.keyAttributes,
        color: newColors
      }
    });
  };

  const updateColorOption = (index: number, value: string) => {
    const newColors = formData.keyAttributes.color.map((color, i) => 
      i === index ? value : color
    );
    setFormData({
      ...formData,
      keyAttributes: {
        ...formData.keyAttributes,
        color: newColors
      }
    });
  };

  const addFeature = () => {
    setFormData({
      ...formData,
      features: [...formData.features, '']
    });
  };

  const removeFeature = (index: number) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = formData.features.map((feature, i) => 
      i === index ? value : feature
    );
    setFormData({ ...formData, features: newFeatures });
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600">Manage your product catalog</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="brand">Brand *</Label>
                      <Input
                        id="brand"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="sku">SKU *</Label>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="currentPrice">Current Price *</Label>
                        <Input
                          id="currentPrice"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.currentPrice}
                          onChange={(e) => setFormData({ ...formData, currentPrice: parseFloat(e.target.value) || 0 })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="originalPrice">Original Price</Label>
                        <Input
                          id="originalPrice"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.originalPrice}
                          onChange={(e) => setFormData({ ...formData, originalPrice: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category._id} value={category._id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="0"
                          value={formData.inventory.quantity}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            inventory: { 
                              ...formData.inventory, 
                              quantity: parseInt(e.target.value) || 0 
                            }
                          })}
                        />
                      </div>
                      <div className="flex items-center space-x-2 pt-6">
                        <Checkbox
                          id="trackQuantity"
                          checked={formData.inventory.trackQuantity}
                          onCheckedChange={(checked) => setFormData({ 
                            ...formData, 
                            inventory: { 
                              ...formData.inventory, 
                              trackQuantity: checked as boolean 
                            }
                          })}
                        />
                        <Label htmlFor="trackQuantity">Track Quantity</Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="shortDescription">Short Description</Label>
                      <Textarea
                        id="shortDescription"
                        value={formData.shortDescription}
                        onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={5}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="tags">Tags (comma separated)</Label>
                      <Input
                        id="tags"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        placeholder="electronics, gadgets, popular"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                        />
                        <Label htmlFor="isActive">Active</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isFeatured"
                          checked={formData.isFeatured}
                          onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked as boolean })}
                        />
                        <Label htmlFor="isFeatured">Featured</Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Images Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Product Images</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addImageField}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Image
                    </Button>
                  </div>
                  {formData.images.map((image, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                      <div>
                        <Label htmlFor={`imageUrl-${index}`}>Image URL</Label>
                        <Input
                          id={`imageUrl-${index}`}
                          value={image.url}
                          onChange={(e) => updateImage(index, 'url', e.target.value)}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`imageAlt-${index}`}>Alt Text</Label>
                        <Input
                          id={`imageAlt-${index}`}
                          value={image.alt}
                          onChange={(e) => updateImage(index, 'alt', e.target.value)}
                          placeholder="Product image description"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-6">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`isPrimary-${index}`}
                            checked={image.isPrimary}
                            onCheckedChange={(checked) => updateImage(index, 'isPrimary', checked as boolean)}
                          />
                          <Label htmlFor={`isPrimary-${index}`}>Primary</Label>
                        </div>
                        {formData.images.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeImageField(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Key Attributes Section */}
                <div className="space-y-4">
                  <Label>Key Attributes</Label>
                  
                  {/* Sizes */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Available Sizes</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addSizeOption}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Size
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {formData.keyAttributes.size.map((size, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={size}
                            onChange={(e) => updateSizeOption(index, e.target.value)}
                            placeholder="Size"
                          />
                          {formData.keyAttributes.size.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeSizeOption(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Available Colors</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addColorOption}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Color
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {formData.keyAttributes.color.map((color, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={color}
                            onChange={(e) => updateColorOption(index, e.target.value)}
                            placeholder="Color"
                          />
                          {formData.keyAttributes.color.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeColorOption(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Features Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Product Features</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Feature
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={feature}
                          onChange={(e) => updateFeature(index, e.target.value)}
                          placeholder="Feature description"
                        />
                        {formData.features.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeFeature(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product')}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Featured</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {products.filter(p => p.isFeatured).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Archive className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {products.filter(p => p.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg. Price</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${products.length > 0 ? (products.reduce((sum, p) => sum + p.currentPrice, 0) / products.length).toFixed(2) : '0.00'}
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
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
                setStatusFilter('all');
                setCurrentPage(1);
              }}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Products ({products.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Product</th>
                    <th className="text-left p-4">Brand</th>
                    <th className="text-left p-4">SKU</th>
                    <th className="text-left p-4">Category</th>
                    <th className="text-left p-4">Price</th>
                    <th className="text-left p-4">Stock</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={product.images[0]?.url || 'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg'}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                              {product.isFeatured && (
                                <Badge variant="secondary" className="text-xs">
                                  <Star className="h-3 w-3 mr-1" />
                                  Featured
                                </Badge>
                              )}
                              {product.discountPercentage && product.discountPercentage > 0 && (
                                <Badge className="bg-red-100 text-red-800 text-xs">
                                  {product.discountPercentage}% OFF
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">{product.brand}</td>
                      <td className="p-4 font-mono text-sm">{product.sku}</td>
                      <td className="p-4">{product.category.name}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">${product.currentPrice}</span>
                          {product.originalPrice && product.originalPrice > product.currentPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              ${product.originalPrice}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {product.inventory.trackQuantity ? (
                          <span className={product.inventory.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                            {product.inventory.quantity}
                          </span>
                        ) : (
                          <span className="text-gray-500">Not tracked</span>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge variant={product.isActive ? 'default' : 'secondary'}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/products/${product.slug}`} target="_blank">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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