const express = require('express');
const Settings = require('../models/Settings');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all settings (Admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const category = req.query.category || '';
    const query = category ? { category } : {};
    
    const settings = await Settings.find(query).sort({ category: 1, key: 1 });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch settings', error: error.message });
  }
});

// Get public settings
router.get('/public', async (req, res) => {
  try {
    const settings = await Settings.find({ isPublic: true }).sort({ category: 1, key: 1 });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch public settings', error: error.message });
  }
});

// Get setting by key
router.get('/:key', adminAuth, async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: req.params.key });
    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch setting', error: error.message });
  }
});

// Create or update setting (Admin only)
router.put('/:key', adminAuth, async (req, res) => {
  try {
    const { value, type, category, description, isPublic, isEditable } = req.body;
    
    const setting = await Settings.findOneAndUpdate(
      { key: req.params.key },
      {
        key: req.params.key,
        value,
        type: type || 'string',
        category: category || 'general',
        description,
        isPublic: isPublic || false,
        isEditable: isEditable !== false
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ message: 'Setting updated successfully', setting });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update setting', error: error.message });
  }
});

// Delete setting (Admin only)
router.delete('/:key', adminAuth, async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: req.params.key });
    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    if (!setting.isEditable) {
      return res.status(400).json({ message: 'This setting cannot be deleted' });
    }

    await Settings.findOneAndDelete({ key: req.params.key });
    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete setting', error: error.message });
  }
});

// Initialize default settings
router.post('/initialize', adminAuth, async (req, res) => {
  try {
    const defaultSettings = [
      {
        key: 'site_name',
        value: 'E-Commerce Store',
        type: 'string',
        category: 'general',
        description: 'Website name',
        isPublic: true
      },
      {
        key: 'site_description',
        value: 'Your one-stop shop for everything',
        type: 'string',
        category: 'general',
        description: 'Website description',
        isPublic: true
      },
      {
        key: 'currency',
        value: 'USD',
        type: 'string',
        category: 'general',
        description: 'Default currency',
        isPublic: true
      },
      {
        key: 'tax_rate',
        value: 0.08,
        type: 'number',
        category: 'commerce',
        description: 'Tax rate (as decimal)',
        isPublic: false
      },
      {
        key: 'free_shipping_threshold',
        value: 100,
        type: 'number',
        category: 'commerce',
        description: 'Minimum order value for free shipping',
        isPublic: true
      },
      {
        key: 'products_per_page',
        value: 12,
        type: 'number',
        category: 'display',
        description: 'Number of products to show per page',
        isPublic: true
      },
      {
        key: 'enable_reviews',
        value: true,
        type: 'boolean',
        category: 'features',
        description: 'Enable product reviews',
        isPublic: true
      }
    ];

    for (const settingData of defaultSettings) {
      await Settings.findOneAndUpdate(
        { key: settingData.key },
        settingData,
        { upsert: true, new: true }
      );
    }

    res.json({ message: 'Default settings initialized successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to initialize settings', error: error.message });
  }
});

module.exports = router;