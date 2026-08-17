const express = require('express');
const router = express.Router();
const Admission = require('../models/Admission');
const { protect, authorize } = require('../middleware/auth');
const connectDB = require('../config/db');

// ============================================================
// PUBLIC ROUTES
// ============================================================

// @route   POST /api/admission
// @desc    Submit admission application
// @access  Public
router.post('/', async (req, res) => {
  try {
    await connectDB();
    const { firstName, lastName, email, phone, grade, message } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !phone || !grade) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields'
      });
    }

    // Save admission application
    const admission = await Admission.create({
      firstName,
      lastName,
      email,
      phone,
      grade,
      message: message || '',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      message: '✅ Your application has been submitted successfully! We will contact you soon.',
      data: admission
    });

  } catch (error) {
    console.error('Admission Form Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================
// ADMIN ROUTES
// ============================================================

// @route   GET /api/admission
// @desc    Get all admissions
// @access  Private (Admin only)
router.get('/', protect, authorize('admin', 'principal'), async (req, res) => {
  try {
    await connectDB();
    const { status, search } = req.query;

    let query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const admissions = await Admission.find(query)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: admissions
    });
  } catch (error) {
    console.error('Get Admissions Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/admission/:id
// @desc    Get single admission
// @access  Private (Admin only)
router.get('/:id', protect, authorize('admin', 'principal'), async (req, res) => {
  try {
    await connectDB();
    const admission = await Admission.findById(req.params.id);

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.status(200).json({
      success: true,
      data: admission
    });
  } catch (error) {
    console.error('Get Admission Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/admission/:id/status
// @desc    Update admission status
// @access  Private (Admin only)
router.put('/:id/status', protect, authorize('admin', 'principal'), async (req, res) => {
  try {
    await connectDB();
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const admission = await Admission.findByIdAndUpdate(
      req.params.id,
      {
        status,
        reviewedBy: req.user.id,
        reviewedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    if (notes) {
      admission.notes.push({
        note: notes,
        createdBy: req.user.id
      });
      await admission.save();
    }

    res.status(200).json({
      success: true,
      message: 'Application status updated',
      data: admission
    });
  } catch (error) {
    console.error('Update Admission Status Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/admission/:id
// @desc    Delete admission
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await connectDB();
    const admission = await Admission.findById(req.params.id);

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    await admission.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error) {
    console.error('Delete Admission Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;