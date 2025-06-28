const express = require('express');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all products with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const minPrice = parseFloat(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || Number.MAX_VALUE;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const featured = req.query.featured === 'true';
    const includeInactive = req.query.includeInactive === 'true';
    const brand = req.query.brand || '';
    const size = req.query.size || '';
    const color = req.query.color || '';

    const query = {};
    
    if (!includeInactive) {
      query.isActive = true;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Handle category filtering by slug or ID
    if (category) {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        // It's an ObjectId
        query.category = category;
      } else {
        // It's a slug, find the category first
        const categoryDoc = await Category.findOne({ slug: category });
        if (categoryDoc) {
          query.category = categoryDoc._id;
        }
      }
    }

    if (brand) {
      query.brand = { $regex: brand, $options: 'i' };
    }
    
    if (size) {
      query['keyAttributes.size'] = { $in: [size] };
    }
    
    if (color) {
      query['keyAttributes.color'] = { $in: [color] };
    }
    
    if (featured) {
      query.isFeatured = true;
    }
    
    query.currentPrice = { $gte: minPrice, $lte: maxPrice };

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .populate('createdBy', 'firstName lastName')
      .sort({ [sortBy]: sortOrder })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
});

// Get product by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ 
      slug: req.params.slug, 
      isActive: true 
    })
      .populate('category', 'name slug')
      .populate('createdBy', 'firstName lastName');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    res.status(500).json({ message: 'Failed to fetch product', error: error.message });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('createdBy', 'firstName lastName');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    res.status(500).json({ message: 'Failed to fetch product', error: error.message });
  }
});

// Create product (Admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    console.log('Creating product with data:', req.body);
    
    // Validate required fields
    const { name, description, sku, currentPrice, category, brand } = req.body;
    
    if (!name || !description || !sku || !currentPrice || !category || !brand) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, description, sku, currentPrice, category, brand' 
      });
    }

    // Check if SKU already exists
    const existingSku = await Product.findOne({ sku });
    if (existingSku) {
      return res.status(400).json({ message: 'SKU already exists' });
    }

    // Ensure images array has at least one item with proper structure
    let images = req.body.images || [];
    if (images.length === 0) {
      images = [{ url: '', alt: name, isPrimary: true }];
    } else {
      // Ensure at least one image is marked as primary
      const hasPrimary = images.some(img => img.isPrimary);
      if (!hasPrimary && images.length > 0) {
        images[0].isPrimary = true;
      }
    }

    // Calculate discount percentage if originalPrice is provided
    let discountPercentage = 0;
    if (req.body.originalPrice && req.body.originalPrice > currentPrice) {
      discountPercentage = Math.round(((req.body.originalPrice - currentPrice) / req.body.originalPrice) * 100);
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

    const productData = {
      ...req.body,
      images,
      slug: slug,                     // Set the generated slug
      discountPercentage,
      createdBy: req.user._id,
      // Ensure inventory object has proper structure
      inventory: {
        quantity: req.body.inventory?.quantity || 0,
        trackQuantity: req.body.inventory?.trackQuantity !== false,
        allowBackorder: req.body.inventory?.allowBackorder || false
      },
      // Ensure arrays are properly formatted
      tags: Array.isArray(req.body.tags) ? req.body.tags : (req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : []),
      attributes: Array.isArray(req.body.attributes) ? req.body.attributes.filter(attr => attr.name && attr.value) : [],
      variants: Array.isArray(req.body.variants) ? req.body.variants.filter(variant => variant.name && variant.options?.length > 0) : [],
      // Ensure keyAttributes has proper structure
      keyAttributes: {
        size: req.body.keyAttributes?.size || ['2XL', '2XS', '3XS', 'L', 'M', 'S', 'XL', 'XS'],
        color: req.body.keyAttributes?.color || ['Gold', 'Orange']
      },
      // Ensure features array
      features: Array.isArray(req.body.features) ? req.body.features : [
        'Aerodynamic Construction',
        'Textured Panels',
        'Ergonomic Fit',
        'Wind Tunnel Testing'
      ],
      // Ensure rating object has proper structure
      rating: {
        average: 0,
        count: 0
      }
    };

    const product = new Product(productData);
    await product.save();
    
    console.log('Product created successfully:', product._id);
    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
});

// Update product (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    console.log('Updating product:', req.params.id, 'with data:', req.body);

    // Ensure images array has proper structure
    let images = req.body.images || [];
    if (images.length > 0) {
      // Ensure at least one image is marked as primary
      const hasPrimary = images.some(img => img.isPrimary);
      if (!hasPrimary) {
        images[0].isPrimary = true;
      }
    }

    // Calculate discount percentage if originalPrice is provided
    let discountPercentage = 0;
    if (req.body.originalPrice && req.body.currentPrice && req.body.originalPrice > req.body.currentPrice) {
      discountPercentage = Math.round(((req.body.originalPrice - req.body.currentPrice) / req.body.originalPrice) * 100);
    }
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

    const updateData = {
      ...req.body,
      images,
      discountPercentage,
      // Ensure inventory object has proper structure
      inventory: {
        quantity: req.body.inventory?.quantity || 0,
        trackQuantity: req.body.inventory?.trackQuantity !== false,
        allowBackorder: req.body.inventory?.allowBackorder || false
      },
      // Ensure arrays are properly formatted
      tags: Array.isArray(req.body.tags) ? req.body.tags : (req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : []),
      attributes: Array.isArray(req.body.attributes) ? req.body.attributes.filter(attr => attr.name && attr.value) : [],
      variants: Array.isArray(req.body.variants) ? req.body.variants.filter(variant => variant.name && variant.options?.length > 0) : [],
      // Ensure keyAttributes has proper structure
      keyAttributes: {
        size: req.body.keyAttributes?.size || ['2XL', '2XS', '3XS', 'L', 'M', 'S', 'XL', 'XS'],
        color: req.body.keyAttributes?.color || ['Gold', 'Orange']
      },
      // Ensure features array
      features: Array.isArray(req.body.features) ? req.body.features : [
        'Aerodynamic Construction',
        'Textured Panels',
        'Ergonomic Fit',
        'Wind Tunnel Testing'
      ]
    };

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('category', 'name slug')

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('Product updated successfully:', product._id);
    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
});

// Delete product (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Failed to delete product', error: error.message });
  }
});

// Get related products
router.get('/:id/related', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      $or: [
        { category: product.category },
        { brand: product.brand }
      ],
      isActive: true
    })
      .populate('category', 'name slug')
      .limit(8)
      .sort({ createdAt: -1 });

    res.json(relatedProducts);
  } catch (error) {
    console.error('Error fetching related products:', error);
    res.status(500).json({ message: 'Failed to fetch related products', error: error.message });
  }
});

// Get unique brands
router.get('/filters/brands', async (req, res) => {
  try {
    const brands = await Product.distinct('brand', { isActive: true });
    res.json(brands.filter(brand => brand)); // Filter out empty brands
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ message: 'Failed to fetch brands', error: error.message });
  }
});

// Get unique sizes
router.get('/filters/sizes', async (req, res) => {
  try {
    const sizes = await Product.distinct('keyAttributes.size', { isActive: true });
    const flatSizes = sizes.flat().filter(size => size);
    const uniqueSizes = [...new Set(flatSizes)];
    res.json(uniqueSizes);
  } catch (error) {
    console.error('Error fetching sizes:', error);
    res.status(500).json({ message: 'Failed to fetch sizes', error: error.message });
  }
});

// Get unique colors
router.get('/filters/colors', async (req, res) => {
  try {
    const colors = await Product.distinct('keyAttributes.color', { isActive: true });
    const flatColors = colors.flat().filter(color => color);
    const uniqueColors = [...new Set(flatColors)];
    res.json(uniqueColors);
  } catch (error) {
    console.error('Error fetching colors:', error);
    res.status(500).json({ message: 'Failed to fetch colors', error: error.message });
  }
});

module.exports = router;