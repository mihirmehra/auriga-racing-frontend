const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get user cart
router.get('/', auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name slug currentPrice images inventory');
    
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
      await cart.save();
    }
    
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch cart', error: error.message });
  }
});

// Add item to cart
router.post('/add', auth, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check inventory
    if (product.inventory.trackQuantity && 
        product.inventory.quantity < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }
    
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }
    
    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );
    
    if (existingItemIndex > -1) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      
      if (product.inventory.trackQuantity && 
          product.inventory.quantity < newQuantity) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }
      
      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].price = product.currentPrice;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity,
        price: product.currentPrice
      });
    }
    
    await cart.save();
    await cart.populate('items.product', 'name slug currentPrice images inventory');
    
    res.json({ message: 'Item added to cart', cart });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add item to cart', error: error.message });
  }
});

// Update cart item quantity
router.put('/update/:productId', auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    const { productId } = req.params;
    
    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check inventory
    if (product.inventory.trackQuantity && 
        product.inventory.quantity < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }
    
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }
    
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].price = product.currentPrice;
    
    await cart.save();
    await cart.populate('items.product', 'name slug currentPrice images inventory');
    
    res.json({ message: 'Cart updated successfully', cart });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update cart', error: error.message });
  }
});

// Remove item from cart
router.delete('/remove/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    cart.items = cart.items.filter(
      item => item.product.toString() !== productId
    );
    
    await cart.save();
    await cart.populate('items.product', 'name slug currentPrice images inventory');
    
    res.json({ message: 'Item removed from cart', cart });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove item from cart', error: error.message });
  }
});

// Clear cart
router.delete('/clear', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    cart.items = [];
    await cart.save();
    
    res.json({ message: 'Cart cleared successfully', cart });
  } catch (error) {
    res.status(500).json({ message: 'Failed to clear cart', error: error.message });
  }
});

module.exports = router;