const express = require('express');
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

const { ObjectId } = require('mongodb'); // Import ObjectId from mongodb

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const rating = req.query.rating ? parseInt(req.query.rating) : null;

    // Validate productId
    const productId = req.params.productId;
    if (!ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const query = { 
      product: new ObjectId(productId), // Use new ObjectId here
      isApproved: true
    };

    if (rating) {
      query.rating = rating;
    }

    const reviews = await Review.find(query)
      .populate('user', 'firstName lastName avatar')
      .sort({ [sortBy]: sortOrder })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments(query);

    // Get rating distribution
    const ratingStats = await Review.aggregate([
      { $match: { product: new ObjectId(productId), isApproved: true } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    res.json({
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      ratingStats
    });
  } catch (error) {
    console.error("Error fetching reviews:", error); // Log the error for debugging
    res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
  }
});

// Get all reviews (Admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const rating = req.query.rating ? parseInt(req.query.rating) : null;

    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { comment: { $regex: search, $options: 'i' } }
      ];
    }

    if (status === 'approved') {
      query.isApproved = true;
    } else if (status === 'pending') {
      query.isApproved = false;
    }

    if (rating) {
      query.rating = rating;
    }

    const reviews = await Review.find(query)
      .populate('user', 'firstName lastName email')
      .populate('product', 'name slug images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments(query);

    res.json({
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
  }
});

// Create review
router.post('/', auth, async (req, res) => {
  try {
    const { productId, rating, title, comment, images } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      user: req.user._id,
      product: productId
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    // Check if user purchased this product
    const order = await Order.findOne({
      user: req.user._id,
      'items.product': productId,
      status: 'delivered'
    });

    const review = new Review({
      user: req.user._id,
      product: productId,
      rating,
      title,
      comment,
      images: images || [],
      isVerifiedPurchase: !!order
    });

    await review.save();
    await review.populate('user', 'firstName lastName avatar');

    res.status(201).json({ message: 'Review created successfully', review });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create review', error: error.message });
  }
});

// Update review
router.put('/:id', auth, async (req, res) => {
  try {
    const { rating, title, comment, images } = req.body;

    const review = await Review.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.rating = rating;
    review.title = title;
    review.comment = comment;
    review.images = images || [];

    await review.save();
    await review.populate('user', 'firstName lastName avatar');

    res.json({ message: 'Review updated successfully', review });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update review', error: error.message });
  }
});

// Delete review
router.delete('/:id', auth, async (req, res) => {
  try {
    const query = { _id: req.params.id };
    
    // If not admin, only allow user to delete their own reviews
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }

    const review = await Review.findOneAndDelete(query);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete review', error: error.message });
  }
});

// Approve/Reject review (Admin only)
router.put('/:id/approve', adminAuth, async (req, res) => {
  try {
    const { isApproved } = req.body;

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isApproved },
      { new: true }
    ).populate('user', 'firstName lastName email')
     .populate('product', 'name slug');

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({ 
      message: `Review ${isApproved ? 'approved' : 'rejected'} successfully`, 
      review 
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update review status', error: error.message });
  }
});

// Add admin response (Admin only)
router.put('/:id/respond', adminAuth, async (req, res) => {
  try {
    const { message } = req.body;

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      {
        adminResponse: {
          message,
          respondedBy: req.user._id,
          respondedAt: new Date()
        }
      },
      { new: true }
    ).populate('user', 'firstName lastName email')
     .populate('product', 'name slug')
     .populate('adminResponse.respondedBy', 'firstName lastName');

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({ message: 'Admin response added successfully', review });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add admin response', error: error.message });
  }
});

// Mark review as helpful
router.put('/:id/helpful', auth, async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $inc: { helpfulVotes: 1 } },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({ message: 'Review marked as helpful', review });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark review as helpful', error: error.message });
  }
});

// Report review
router.put('/:id/report', auth, async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $inc: { reportCount: 1 } },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({ message: 'Review reported successfully', review });
  } catch (error) {
    res.status(500).json({ message: 'Failed to report review', error: error.message });
  }
});

module.exports = router;