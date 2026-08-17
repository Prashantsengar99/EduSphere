const express = require('express');
const router = express.Router();
const Enquiry = require('../models/Enquiry');
const { protect, authorize } = require('../middleware/auth');
const connectDB = require('../config/db');

// ============================================================
// PUBLIC ROUTES
// ============================================================

// @route   POST /api/enquiry
// @desc    Submit enquiry form
// @access  Public
router.post('/', async (req, res) => {
  try {
    await connectDB();
    const { name, email, phone, enquiryType, course, class: studentClass, message, preferredContact } = req.body;

    // Validation
    if (!name || !email || !phone || !enquiryType || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields'
      });
    }

    // Save enquiry
    const enquiry = await Enquiry.create({
      name,
      email,
      phone,
      enquiryType,
      course,
      class: studentClass,
      message,
      preferredContact: preferredContact || 'email',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your enquiry! Our team will contact you soon.',
      data: enquiry
    });

  } catch (error) {
    console.error('Enquiry Form Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================
// ADMIN ROUTES
// ============================================================

// @route   GET /api/enquiry
// @desc    Get all enquiries
// @access  Private (Admin only)
router.get('/', protect, authorize('admin', 'principal'), async (req, res) => {
  try {
    await connectDB();
    const { status, enquiryType, search } = req.query;

    let query = {};
    if (status) query.status = status;
    if (enquiryType) query.enquiryType = enquiryType;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const enquiries = await Enquiry.find(query)
      .populate('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: enquiries
    });
  } catch (error) {
    console.error('Get Enquiries Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/enquiry/:id
// @desc    Get single enquiry
// @access  Private (Admin only)
router.get('/:id', protect, authorize('admin', 'principal'), async (req, res) => {
  try {
    await connectDB();
    const enquiry = await Enquiry.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('notes.createdBy', 'firstName lastName email');

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found'
      });
    }

    // Mark as contacted if new
    if (enquiry.status === 'new') {
      enquiry.status = 'contacted';
      await enquiry.save();
    }

    res.status(200).json({
      success: true,
      data: enquiry
    });
  } catch (error) {
    console.error('Get Enquiry Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/enquiry/:id/status
// @desc    Update enquiry status
// @access  Private (Admin only)
router.put('/:id/status', protect, authorize('admin', 'principal'), async (req, res) => {
  try {
    await connectDB();
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Enquiry status updated',
      data: enquiry
    });
  } catch (error) {
    console.error('Update Enquiry Status Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/enquiry/:id/notes
// @desc    Add note to enquiry
// @access  Private (Admin only)
router.post('/:id/notes', protect, authorize('admin', 'principal'), async (req, res) => {
  try {
    await connectDB();
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({
        success: false,
        message: 'Note is required'
      });
    }

    const enquiry = await Enquiry.findById(req.params.id);

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found'
      });
    }

    enquiry.notes.push({
      note,
      createdBy: req.user.id
    });

    await enquiry.save();

    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      data: enquiry
    });
  } catch (error) {
    console.error('Add Note Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/enquiry/:id/assign
// @desc    Assign enquiry to staff
// @access  Private (Admin only)
router.put('/:id/assign', protect, authorize('admin', 'principal'), async (req, res) => {
  try {
    await connectDB();
    const { assignedTo } = req.body;

    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Please select a staff member'
      });
    }

    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { assignedTo },
      { new: true, runValidators: true }
    );

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Enquiry assigned successfully',
      data: enquiry
    });
  } catch (error) {
    console.error('Assign Enquiry Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/enquiry/:id
// @desc    Delete enquiry
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await connectDB();
    const enquiry = await Enquiry.findById(req.params.id);

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found'
      });
    }

    await enquiry.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Enquiry deleted successfully'
    });
  } catch (error) {
    console.error('Delete Enquiry Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;