'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { categoriesAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FolderTree, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Eye,
  Package
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { toast } from 'sonner';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

interface SubCategory {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
  category: { _id: string; name: string };
  createdAt: string;
}

export default function AdminCategoriesPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'categories' | 'subcategories'>('categories');

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    image: '',
    isActive: true,
    sortOrder: 0
  });

  const [subCategoryFormData, setSubCategoryFormData] = useState({
    name: '',
    description: '',
    image: '',
    category: '',
    isActive: true,
    sortOrder: 0
  });

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }

    fetchCategories();
  }, [isAdmin, router]);

  useEffect(() => {
    if (categories.length > 0) {
      fetchSubCategories();
    }
  }, [categories]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll({ includeInactive: true });
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubCategories = async () => {
    try {
      // Fetch subcategories for all categories
      const allSubCategories: SubCategory[] = [];
      for (const category of categories) {
        try {
          const response = await categoriesAPI.getSubCategories(category._id, { includeInactive: true });
          allSubCategories.push(...response.data);
        } catch (error) {
          console.error(`Error fetching subcategories for ${category.name}:`, error);
        }
      }
      setSubCategories(allSubCategories);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      description: '',
      image: '',
      isActive: true,
      sortOrder: 0
    });
    setEditingCategory(null);
  };

  const resetSubCategoryForm = () => {
    setSubCategoryFormData({
      name: '',
      description: '',
      image: '',
      category: '',
      isActive: true,
      sortOrder: 0
    });
    setEditingSubCategory(null);
  };

  const handleEditCategory = (category: Category) => {
    setCategoryFormData({
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      isActive: category.isActive,
      sortOrder: category.sortOrder || 0
    });
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleEditSubCategory = (subCategory: SubCategory) => {
    setSubCategoryFormData({
      name: subCategory.name,
      description: subCategory.description || '',
      image: subCategory.image || '',
      category: subCategory.category._id,
      isActive: subCategory.isActive,
      sortOrder: subCategory.sortOrder || 0
    });
    setEditingSubCategory(subCategory);
    setSubDialogOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!categoryFormData.name.trim()) {
        toast.error('Category name is required');
        setSubmitting(false);
        return;
      }

      if (editingCategory) {
        const response = await categoriesAPI.update(editingCategory._id, categoryFormData);
        setCategories(categories.map(category => 
          category._id === editingCategory._id ? response.data.category : category
        ));
        toast.success('Category updated successfully');
      } else {
        const response = await categoriesAPI.create(categoryFormData);
        setCategories([response.data.category, ...categories]);
        toast.success('Category created successfully');
      }
      
      setDialogOpen(false);
      resetCategoryForm();
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast.error(error.response?.data?.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!subCategoryFormData.name.trim()) {
        toast.error('Subcategory name is required');
        setSubmitting(false);
        return;
      }

      if (!subCategoryFormData.category) {
        toast.error('Please select a parent category');
        setSubmitting(false);
        return;
      }

      if (editingSubCategory) {
        const response = await categoriesAPI.updateSubCategory(editingSubCategory._id, subCategoryFormData);
        setSubCategories(subCategories.map(subCategory => 
          subCategory._id === editingSubCategory._id ? response.data.subCategory : subCategory
        ));
        toast.success('Subcategory updated successfully');
      } else {
        const response = await categoriesAPI.createSubCategory(subCategoryFormData.category, subCategoryFormData);
        setSubCategories([response.data.subCategory, ...subCategories]);
        toast.success('Subcategory created successfully');
      }
      
      setSubDialogOpen(false);
      resetSubCategoryForm();
    } catch (error: any) {
      console.error('Error saving subcategory:', error);
      toast.error(error.response?.data?.message || 'Failed to save subcategory');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This will also delete all subcategories.')) return;

    try {
      await categoriesAPI.delete(categoryId);
      setCategories(categories.filter(category => category._id !== categoryId));
      setSubCategories(subCategories.filter(sub => sub.category._id !== categoryId));
      toast.success('Category deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleDeleteSubCategory = async (subCategoryId: string) => {
    if (!confirm('Are you sure you want to delete this subcategory?')) return;

    try {
      await categoriesAPI.deleteSubCategory(subCategoryId);
      setSubCategories(subCategories.filter(subCategory => subCategory._id !== subCategoryId));
      toast.success('Subcategory deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete subcategory');
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSubCategories = subCategories.filter(subCategory =>
    subCategory.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subCategory.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subCategory.category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-600">Manage product categories and subcategories</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetCategoryForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="categoryName">Category Name *</Label>
                    <Input
                      id="categoryName"
                      value={categoryFormData.name}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="categoryDescription">Description</Label>
                    <Textarea
                      id="categoryDescription"
                      value={categoryFormData.description}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="categoryImage">Image URL</Label>
                    <Input
                      id="categoryImage"
                      value={categoryFormData.image}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, image: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="categorySortOrder">Sort Order</Label>
                    <Input
                      id="categorySortOrder"
                      type="number"
                      value={categoryFormData.sortOrder}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, sortOrder: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="categoryIsActive"
                      checked={categoryFormData.isActive}
                      onCheckedChange={(checked) => setCategoryFormData({ ...categoryFormData, isActive: checked as boolean })}
                    />
                    <Label htmlFor="categoryIsActive">Active</Label>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Saving...' : (editingCategory ? 'Update Category' : 'Create Category')}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={resetSubCategoryForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Subcategory
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingSubCategory ? 'Edit Subcategory' : 'Add New Subcategory'}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubCategorySubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="subCategoryName">Subcategory Name *</Label>
                    <Input
                      id="subCategoryName"
                      value={subCategoryFormData.name}
                      onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="subCategoryCategory">Parent Category *</Label>
                    <select
                      id="subCategoryCategory"
                      value={subCategoryFormData.category}
                      onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, category: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.filter(cat => cat.isActive).map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="subCategoryDescription">Description</Label>
                    <Textarea
                      id="subCategoryDescription"
                      value={subCategoryFormData.description}
                      onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="subCategoryImage">Image URL</Label>
                    <Input
                      id="subCategoryImage"
                      value={subCategoryFormData.image}
                      onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, image: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="subCategorySortOrder">Sort Order</Label>
                    <Input
                      id="subCategorySortOrder"
                      type="number"
                      value={subCategoryFormData.sortOrder}
                      onChange={(e) => setSubCategoryFormData({ ...subCategoryFormData, sortOrder: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="subCategoryIsActive"
                      checked={subCategoryFormData.isActive}
                      onCheckedChange={(checked) => setSubCategoryFormData({ ...subCategoryFormData, isActive: checked as boolean })}
                    />
                    <Label htmlFor="subCategoryIsActive">Active</Label>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Saving...' : (editingSubCategory ? 'Update Subcategory' : 'Create Subcategory')}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setSubDialogOpen(false)}>
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
                <FolderTree className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Categories</p>
                  <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Subcategories</p>
                  <p className="text-2xl font-bold text-gray-900">{subCategories.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Categories</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {categories.filter(c => c.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Subcategories</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {subCategories.filter(s => s.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Tabs */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex gap-2">
                <Button
                  variant={activeTab === 'categories' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('categories')}
                >
                  <FolderTree className="mr-2 h-4 w-4" />
                  Categories ({categories.length})
                </Button>
                <Button
                  variant={activeTab === 'subcategories' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('subcategories')}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Subcategories ({subCategories.length})
                </Button>
              </div>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories Table */}
        {activeTab === 'categories' && (
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Name</th>
                      <th className="text-left p-4">Description</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Sort Order</th>
                      <th className="text-left p-4">Created</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((category) => (
                      <tr key={category._id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={category.image || 'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg'}
                              alt={category.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div>
                              <div className="font-medium">{category.name}</div>
                              <div className="text-sm text-gray-500">{category.slug}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 max-w-xs">
                          <div className="truncate">{category.description || 'No description'}</div>
                        </td>
                        <td className="p-4">
                          <Badge variant={category.isActive ? 'default' : 'secondary'}>
                            {category.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="p-4">{category.sortOrder}</td>
                        <td className="p-4">
                          {new Date(category.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditCategory(category)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCategory(category._id)}
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
            </CardContent>
          </Card>
        )}

        {/* Subcategories Table */}
        {activeTab === 'subcategories' && (
          <Card>
            <CardHeader>
              <CardTitle>Subcategories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Name</th>
                      <th className="text-left p-4">Parent Category</th>
                      <th className="text-left p-4">Description</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Sort Order</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubCategories.map((subCategory) => (
                      <tr key={subCategory._id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={subCategory.image || 'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg'}
                              alt={subCategory.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div>
                              <div className="font-medium">{subCategory.name}</div>
                              <div className="text-sm text-gray-500">{subCategory.slug}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">{subCategory.category.name}</Badge>
                        </td>
                        <td className="p-4 max-w-xs">
                          <div className="truncate">{subCategory.description || 'No description'}</div>
                        </td>
                        <td className="p-4">
                          <Badge variant={subCategory.isActive ? 'default' : 'secondary'}>
                            {subCategory.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="p-4">{subCategory.sortOrder}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditSubCategory(subCategory)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteSubCategory(subCategory._id)}
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
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}