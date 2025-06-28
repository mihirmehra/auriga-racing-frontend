const express = require('express');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get user wishlist
router.get('/', auth, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate('items.product', 'name slug price images category subCategory');
    
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, items: [] });
      await wishlist.save();
    }
    
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch wishlist', error: error.message });
  }
});

// Add item to wishlist
router.post('/add', auth, async (req, res) => {
  try {
    const { productId } = req.body;
    
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, items: [] });
    }
    
    // Check if item already exists in wishlist
    const existingItem = wishlist.items.find(
      item => item.product.toString() === productId
    );
    
    if (existingItem) {
      return res.status(400).json({ message: 'Item already in wishlist' });
    }
    
    wishlist.items.push({ product: productId });
    await wishlist.save();
    await wishlist.populate('items.product', 'name slug price images category subCategory');
    
    res.json({ message: 'Item added to wishlist', wishlist });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add item to wishlist', error: error.message });
  }
});

// Remove item from wishlist
router.delete('/remove/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }
    
    wishlist.items = wishlist.items.filter(
      item => item.product.toString() !== productId
    );
    
    await wishlist.save();
    await wishlist.populate('items.product', 'name slug price images category subCategory');
    
    res.json({ message: 'Item removed from wishlist', wishlist });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove item from wishlist', error: error.message });
  }
});

// Clear wishlist
router.delete('/clear', auth, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }
    
    wishlist.items = [];
    await wishlist.save();
    
    res.json({ message: 'Wishlist cleared successfully', wishlist });
  } catch (error) {
    res.status(500).json({ message: 'Failed to clear wishlist', error: error.message });
  }
});

// Move item from wishlist to cart
router.post('/move-to-cart/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity = 1 } = req.body;
    
    // Remove from wishlist
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) {
      wishlist.items = wishlist.items.filter(
        item => item.product.toString() !== productId
      );
      await wishlist.save();
    }
    
    // Add to cart (you would need to import cart logic or make API call)
    res.json({ message: 'Item moved to cart successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to move item to cart', error: error.message });
  }
});

module.exports = router;