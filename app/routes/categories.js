const express = require('express');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const Product = require('../models/Product');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const query = includeInactive ? {} : { isActive: true };
    
    const categories = await Category.find(query).sort({ sortOrder: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
  }
});

// Get category by slug with subcategories
router.get('/slug/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const subCategories = await SubCategory.find({ 
      category: category._id, 
      isActive: true 
    }).sort({ sortOrder: 1, name: 1 });

    res.json({ ...category.toObject(), subCategories });
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    res.status(500).json({ message: 'Failed to fetch category', error: error.message });
  }
});

// Create category (Admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    console.log('Creating category with data:', req.body);
    
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // Check if category with same name already exists
    const existingCategory = await Category.findOne({ name: name.trim() });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }

    // Generate slug from name
    const slug = name
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
      .replace(/\-\-+/g, '-')         // Replace multiple - with single -
      .replace(/^-+/, '')             // Trim - from start of text
      .replace(/-+$/, '');            // Trim - from end of text

    const categoryData = {
      name: name.trim(),
      slug: slug,                     // Set the generated slug
      description: req.body.description?.trim() || '',
      image: req.body.image || '',
      isActive: req.body.isActive !== false,
      sortOrder: req.body.sortOrder || 0
    };

    const category = new Category(categoryData);
    await category.save();
    
    console.log('Category created successfully:', category._id, 'with slug:', category.slug);
    res.status(201).json({ message: 'Category created successfully', category });
  } catch (error) {
    console.error('Error creating category:', error);
    if (error.code === 11000) {
      // Check which field caused the duplicate key error
      if (error.keyPattern && error.keyPattern.slug) {
        res.status(400).json({ message: 'A category with a similar name already exists' });
      } else {
        res.status(400).json({ message: 'Category with this name already exists' });
      }
    } else if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      res.status(400).json({ message: messages.join(', ') });
    } else {
      res.status(500).json({ message: 'Failed to create category', error: error.message });
    }
  }
});


// Update category (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    console.log('Updating category:', req.params.id, 'with data:', req.body);

    const updateData = {
      name: req.body.name?.trim(),
      description: req.body.description?.trim() || '',
      image: req.body.image || '',
      isActive: req.body.isActive,
      sortOrder: req.body.sortOrder || 0
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Generate slug if name is updated
    if (updateData.name) {
      const slug = updateData.name
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text

      updateData.slug = slug; // Set the generated slug
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    console.log('Category updated successfully:', category._id, 'with slug:', category.slug);
    res.json({ message: 'Category updated successfully', category });
  } catch (error) {
    console.error('Error updating category:', error);
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.slug) {
        res.status(400).json({ message: 'A category with a similar name already exists' });
      } else {
        res.status(400).json({ message: 'Category with this name already exists' });
      }
    } else if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      res.status(400).json({ message: messages.join(', ') });
    } else {
      res.status(500).json({ message: 'Failed to update category', error: error.message });
    }
  }
});


// Delete category (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    // Check if category has products
    const productCount = await Product.countDocuments({ category: req.params.id });
    if (productCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with existing products' 
      });
    }

    // Delete subcategories first
    await SubCategory.deleteMany({ category: req.params.id });
    
    // Delete category
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Failed to delete category', error: error.message });
  }
});

// Subcategory routes
// Get subcategories by category
router.get('/:categoryId/subcategories', async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const query = { 
      category: req.params.categoryId,
      ...(includeInactive ? {} : { isActive: true })
    };
    
    const subCategories = await SubCategory.find(query)
      .populate('category', 'name slug')
      .sort({ sortOrder: 1, name: 1 });
    
    res.json(subCategories);
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({ message: 'Failed to fetch subcategories', error: error.message });
  }
});

// Create subcategory (Admin only)
router.post('/:categoryId/subcategories', adminAuth, async (req, res) => {
  try {
    console.log('Creating subcategory for category:', req.params.categoryId, 'with data:', req.body);

    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Subcategory name is required' });
    }

    // Check if parent category exists
    const parentCategory = await Category.findById(req.params.categoryId);
    if (!parentCategory) {
      return res.status(404).json({ message: 'Parent category not found' });
    }

    // Check if subcategory with same name already exists in this category
    const existingSubCategory = await SubCategory.findOne({ 
      category: req.params.categoryId,
      name: name.trim()
    });
    if (existingSubCategory) {
      return res.status(400).json({ message: 'Subcategory with this name already exists in this category' });
    }

    // Generate slug from name
    const slug = name
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
      .replace(/\-\-+/g, '-')         // Replace multiple - with single -
      .replace(/^-+/, '')             // Trim - from start of text
      .replace(/-+$/, '');            // Trim - from end of text

    const subCategoryData = {
      name: name.trim(),
      slug: slug,                     // Set the generated slug
      category: req.params.categoryId,
      description: req.body.description?.trim() || '',
      image: req.body.image || '',
      isActive: req.body.isActive !== false,
      sortOrder: req.body.sortOrder || 0
    };

    const subCategory = new SubCategory(subCategoryData);
    await subCategory.save();
    await subCategory.populate('category', 'name slug');
    
    console.log('Subcategory created successfully:', subCategory._id, 'with slug:', subCategory.slug);
    res.status(201).json({ message: 'Subcategory created successfully', subCategory });
  } catch (error) {
    console.error('Error creating subcategory:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Subcategory with this name already exists in this category' });
    } else if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      res.status(400).json({ message: messages.join(', ') });
    } else {
      res.status(500).json({ message: 'Failed to create subcategory', error: error.message });
    }
  }
});

// Update subcategory (Admin only)
router.put('/subcategories/:id', adminAuth, async (req, res) => {
  try {
    console.log('Updating subcategory:', req.params.id, 'with data:', req.body);

    const updateData = {
      name: req.body.name?.trim(),
      description: req.body.description?.trim() || '',
      image: req.body.image || '',
      isActive: req.body.isActive,
      sortOrder: req.body.sortOrder || 0
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Generate slug if name is updated
    if (updateData.name) {
      const slug = updateData.name
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text

      updateData.slug = slug; // Set the generated slug
    }

    const subCategory = await SubCategory.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name slug');
    
    if (!subCategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    console.log('Subcategory updated successfully:', subCategory._id, 'with slug:', subCategory.slug);
    res.json({ message: 'Subcategory updated successfully', subCategory });
  } catch (error) {
    console.error('Error updating subcategory:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Subcategory with this name already exists in this category' });
    } else if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      res.status(400).json({ message: messages.join(', ') });
    } else {
      res.status(500).json({ message: 'Failed to update subcategory', error: error.message });
    }
  }
});


// Delete subcategory (Admin only)
router.delete('/subcategories/:id', adminAuth, async (req, res) => {
  try {
    // Check if subcategory has products
    const productCount = await Product.countDocuments({ subCategory: req.params.id });
    if (productCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete subcategory with existing products' 
      });
    }

    const subCategory = await SubCategory.findByIdAndDelete(req.params.id);
    if (!subCategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    res.json({ message: 'Subcategory deleted successfully' });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    res.status(500).json({ message: 'Failed to delete subcategory', error: error.message });
  }
});

module.exports = router;