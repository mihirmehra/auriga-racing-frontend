const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get user orders
router.get('/my-orders', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || '';

    const query = { user: req.user._id };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('items.product', 'name slug images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

// Get all orders (Admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || '';
    const search = req.query.search || '';

    const query = {};
    if (status) {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.firstName': { $regex: search, $options: 'i' } },
        { 'shippingAddress.lastName': { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query)
      .populate('user', 'firstName lastName email')
      .populate('items.product', 'name slug images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

// Get order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const query = { _id: req.params.id };
    
    // If not admin, only allow user to see their own orders
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }

    const order = await Order.findOne(query)
      .populate('user', 'firstName lastName email')
      .populate('items.product', 'name slug images');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch order', error: error.message });
  }
});

// Create order
router.post('/', auth, async (req, res) => {
  try {
    const { items, shippingAddress, billingAddress, paymentMethod } = req.body;

    // Validate products and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive) {
        return res.status(400).json({ 
          message: `Product ${item.product} is not available` 
        });
      }

      // Check inventory
      if (product.inventory.trackQuantity && 
          product.inventory.quantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}` 
        });
      }

      const itemTotal = product.currentPrice * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images[0]?.url || '',
        price: product.currentPrice,
        quantity: item.quantity,
        total: itemTotal
      });

      // Update inventory
      if (product.inventory.trackQuantity) {
        product.inventory.quantity -= item.quantity;
        await product.save();
      }
    }

    const tax = subtotal * 0.08; // 8% tax
    const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
    const total = subtotal + tax + shipping;

    const order = new Order({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      billingAddress,
      subtotal,
      tax,
      shipping,
      total,
      paymentMethod
    });

    await order.save();
    await order.populate('items.product', 'name slug images');

    res.status(201).json({ message: 'Order created successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
});

// Update order status (Admin only)
router.put('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status, trackingNumber, notes } = req.body;

    const updateData = { status };
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (notes) updateData.notes = notes;

    // Set specific timestamps based on status
    if (status === 'delivered') {
      updateData.deliveredAt = new Date();
    } else if (status === 'cancelled') {
      updateData.cancelledAt = new Date();
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('items.product', 'name slug images');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Order status updated successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order status', error: error.message });
  }
});

// Cancel order
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const query = { _id: req.params.id };
    
    // If not admin, only allow user to cancel their own orders
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }

    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only allow cancellation if order is not shipped
    if (['shipped', 'delivered'].includes(order.status)) {
      return res.status(400).json({ message: 'Cannot cancel shipped or delivered orders' });
    }

    // Restore inventory
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product && product.inventory.trackQuantity) {
        product.inventory.quantity += item.quantity;
        await product.save();
      }
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    await order.save();

    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel order', error: error.message });
  }
});

module.exports = router;