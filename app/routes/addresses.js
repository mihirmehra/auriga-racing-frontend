const express = require('express');
const Address = require('../models/Address');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get user addresses
router.get('/', auth, async (req, res) => {
  try {
    const addresses = await Address.find({ 
      user: req.user._id, 
      isActive: true 
    }).sort({ isDefault: -1, createdAt: -1 });
    
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch addresses', error: error.message });
  }
});

// Get address by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const address = await Address.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });
    
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }
    
    res.json(address);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch address', error: error.message });
  }
});

// Create address
router.post('/', auth, async (req, res) => {
  try {
    const address = new Address({
      ...req.body,
      user: req.user._id
    });
    
    await address.save();
    res.status(201).json({ message: 'Address created successfully', address });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create address', error: error.message });
  }
});

// Update address
router.put('/:id', auth, async (req, res) => {
  try {
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }
    
    res.json({ message: 'Address updated successfully', address });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update address', error: error.message });
  }
});

// Delete address
router.delete('/:id', auth, async (req, res) => {
  try {
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isActive: false },
      { new: true }
    );
    
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }
    
    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete address', error: error.message });
  }
});

// Set default address
router.put('/:id/default', auth, async (req, res) => {
  try {
    const address = await Address.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });
    
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }
    
    address.isDefault = true;
    await address.save();
    
    res.json({ message: 'Default address updated successfully', address });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update default address', error: error.message });
  }
});

module.exports = router;