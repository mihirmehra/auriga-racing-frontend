const express = require('express');
const Notification = require('../models/Notification');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get user notifications
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const unreadOnly = req.query.unreadOnly === 'true';

    const query = { user: req.user._id };
    if (unreadOnly) {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ 
      user: req.user._id, 
      isRead: false 
    });

    res.json({
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark notification as read', error: error.message });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark all notifications as read', error: error.message });
  }
});

// Delete notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete notification', error: error.message });
  }
});

// Create notification (Admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { users, title, message, type, priority, data } = req.body;

    const notifications = users.map(userId => ({
      user: userId,
      title,
      message,
      type,
      priority,
      data
    }));

    await Notification.insertMany(notifications);

    res.status(201).json({ 
      message: 'Notifications created successfully',
      count: notifications.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create notifications', error: error.message });
  }
});

// Send notification to all users (Admin only)
router.post('/broadcast', adminAuth, async (req, res) => {
  try {
    const { title, message, type, priority, data } = req.body;

    // Get all active users
    const User = require('../models/User');
    const users = await User.find({ isActive: true }).select('_id');

    const notifications = users.map(user => ({
      user: user._id,
      title,
      message,
      type,
      priority,
      data
    }));

    await Notification.insertMany(notifications);

    res.status(201).json({ 
      message: 'Broadcast notification sent successfully',
      count: notifications.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send broadcast notification', error: error.message });
  }
});

module.exports = router;