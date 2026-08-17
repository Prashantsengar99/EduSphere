const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { protect, authorize } = require('../middleware/auth');
const connectDB = require('../config/db');

// ============================================================
// PUBLIC ROUTES
// ============================================================

// @route   POST /api/contact
// @desc    Submit contact form
// @access  Public
router.post('/', async (req, res) => {
  try {
    await connectDB();
    const { name, email, phone, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields'
      });
    }

    // Save contact
    const contact = await Contact.create({
      name,
      email,
      phone,
      subject,
      message,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for contacting us! We will get back to you soon.',
      data: contact
    });

  } catch (error) {
    console.error('Contact Form Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================
// ADMIN ROUTES
// ============================================================

// @route   GET /api/contact
// @desc    Get all contacts
// @access  Private (Admin only)
router.get('/', protect, authorize('admin', 'principal'), async (req, res) => {
  try {
    await connectDB();
    const { status, search } = req.query;

    let query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: contacts
    });
  } catch (error) {
    console.error('Get Contacts Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/contact/:id
// @desc    Get single contact
// @access  Private (Admin only)
router.get('/:id', protect, authorize('admin', 'principal'), async (req, res) => {
  try {
    await connectDB();
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Mark as read
    if (contact.status === 'new') {
      contact.status = 'read';
      await contact.save();
    }

    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Get Contact Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/contact/:id/reply
// @desc    Reply to contact
// @access  Private (Admin only)
router.put('/:id/reply', protect, authorize('admin', 'principal'), async (req, res) => {
  try {
    await connectDB();
    const { replyMessage } = req.body;

    if (!replyMessage) {
      return res.status(400).json({
        success: false,
        message: 'Reply message is required'
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      {
        replyMessage,
        repliedBy: req.user.id,
        repliedAt: new Date(),
        status: 'replied'
      },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reply sent successfully',
      data: contact
    });
  } catch (error) {
    console.error('Reply Contact Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/contact/:id
// @desc    Delete contact
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await connectDB();
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    await contact.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('Delete Contact Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;