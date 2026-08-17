const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Fee = require('../models/Fee');
const Settings = require('../models/Settings');
const Notification = require('../models/Notification');
const connectDB = require('../config/db');

// ============ USER MANAGEMENT ============

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin/Principal only)
router.get('/users', protect, authorize('admin', 'principal'), async (req, res) => {
  try {
    await connectDB();
    const { role, status, search } = req.query;

    let query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/admin/users
// @desc    Create a new user (Admin only)
// @access  Private (Admin only)
router.post('/users', protect, authorize('admin'), async (req, res) => {
  try {
    await connectDB();
    const { firstName, lastName, email, password, role, status } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: password || 'password123',
      role: role || 'student',
      status: status || 'active',
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Create User Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Private (Admin only)
router.put('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await connectDB();
    const { firstName, lastName, email, role, status, phone, address } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, email, role, status, phone, address },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update User Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await connectDB();
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last admin user'
        });
      }
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ CLASS MANAGEMENT ============

// @route   GET /api/admin/classes
// @desc    Get all classes
// @access  Private (Admin/Principal only)
router.get('/classes', protect, authorize('admin', 'principal'), async (req, res) => {
  try {
    await connectDB();
    const classes = await Class.find()
      .populate('classTeacher', 'user')
      .populate('classTeacher.user', 'firstName lastName')
      .populate('students', 'user rollNumber')
      .populate('subjects.subject', 'name code')
      .populate('subjects.teacher', 'user')
      .populate('subjects.teacher.user', 'firstName lastName');

    // Add student count to each class
    const classesWithCount = await Promise.all(classes.map(async (cls) => {
      const studentCount = await Student.countDocuments({ class: cls._id });
      return {
        ...cls.toObject(),
        studentCount
      };
    }));

    res.status(200).json({
      success: true,
      data: classesWithCount
    });
  } catch (error) {
    console.error('Get Classes Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/admin/classes
// @desc    Create a new class
// @access  Private (Admin only)
router.post('/classes', protect, authorize('admin'), async (req, res) => {
  try {
    await connectDB();
    const classData = req.body;
    const newClass = await Class.create(classData);

    res.status(201).json({
      success: true,
      data: newClass
    });
  } catch (error) {
    console.error('Create Class Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/admin/classes/:id
// @desc    Update class
// @access  Private (Admin only)
router.put('/classes/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await connectDB();
    const classData = req.body;
    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      classData,
      { new: true, runValidators: true }
    );

    if (!updatedClass) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.status(200).json({
      success: true,
      data: updatedClass
    });
  } catch (error) {
    console.error('Update Class Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/admin/classes/:id
// @desc    Delete class
// @access  Private (Admin only)
router.delete('/classes/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await connectDB();
    const classToDelete = await Class.findById(req.params.id);

    if (!classToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check if class has students
    const studentCount = await Student.countDocuments({ class: req.params.id });
    if (studentCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete class with enrolled students. Remove students first.'
      });
    }

    await classToDelete.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error) {
    console.error('Delete Class Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ STUDENT MANAGEMENT ============

// @route   GET /api/admin/students
// @desc    Get all students
// @access  Private (Admin/Principal only)
router.get('/students', protect, authorize('admin', 'principal'), async (req, res) => {
  try {
    await connectDB();
    const { class: classId, search } = req.query;

    let query = {};
    if (classId) query.class = classId;
    if (search) {
      const users = await User.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      query.user = { $in: users.map(u => u._id) };
    }

    const students = await Student.find(query)
      .populate('user', 'firstName lastName email phone profileImage')
      .populate('class', 'name section grade');

    res.status(200).json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Get Students Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================
// ✅ NEW: STUDENT PROFILE CRUD (FIXED)
// ============================================================

// @route   POST /api/admin/students
// @desc    Create student profile
// @access  Private (Admin only)
router.post('/students', protect, authorize('admin'), async (req, res) => {
  try {
    await connectDB();
    const { userId, rollNumber, classId, section, parentName, parentPhone, parentEmail } = req.body;

    console.log('📝 Creating student profile:', { userId, classId, section });

    if (!userId || !classId) {
      return res.status(400).json({
        success: false,
        message: 'userId and classId are required'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is a student
    if (user.role !== 'student') {
      return res.status(400).json({
        success: false,
        message: 'User is not a student'
      });
    }

    // Check if student already exists
    const existing = await Student.findOne({ user: userId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Student profile already exists'
      });
    }

    const student = await Student.create({
      user: userId,
      rollNumber: rollNumber || `STU${Date.now().toString().slice(-6)}`,
      class: classId,
      section: section || 'A',
      parentName: parentName || '',
      parentPhone: parentPhone || '',
      parentEmail: parentEmail || '',
      isActive: true
    });

    // Populate student with user data
    await student.populate('user', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: '✅ Student profile created successfully',
      data: student
    });
  } catch (error) {
    console.error('Create Student Profile Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/admin/students/:id
// @desc    Update student profile
// @access  Private (Admin only)
router.put('/students/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await connectDB();
    const { rollNumber, classId, section, parentName, parentPhone, parentEmail, isActive } = req.body;

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      {
        rollNumber: rollNumber || undefined,
        class: classId || undefined,
        section: section || undefined,
        parentName: parentName || undefined,
        parentPhone: parentPhone || undefined,
        parentEmail: parentEmail || undefined,
        isActive: isActive !== undefined ? isActive : undefined
      },
      { new: true, runValidators: true }
    ).populate('user', 'firstName lastName email');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      message: '✅ Student profile updated successfully',
      data: student
    });
  } catch (error) {
    console.error('Update Student Profile Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/admin/students/:id
// @desc    Delete student profile
// @access  Private (Admin only)
router.delete('/students/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await connectDB();
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    await student.deleteOne();

    res.status(200).json({
      success: true,
      message: '✅ Student profile deleted successfully'
    });
  } catch (error) {
    console.error('Delete Student Profile Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ TEACHER MANAGEMENT ============

// @route   GET /api/admin/teachers
// @desc    Get all teachers
// @access  Private (Admin/Principal only)
router.get('/teachers', protect, authorize('admin', 'principal'), async (req, res) => {
  try {
    await connectDB();
    const teachers = await Teacher.find()
      .populate('user', 'firstName lastName email phone profileImage')
      .populate('subjects', 'name code')
      .populate('classes', 'name section grade');

    res.status(200).json({
      success: true,
      data: teachers
    });
  } catch (error) {
    console.error('Get Teachers Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ SUBJECT MANAGEMENT ============

// @route   GET /api/admin/subjects
// @desc    Get all subjects
// @access  Private (Admin/Principal only)
router.get('/subjects', protect, authorize('admin', 'principal'), async (req, res) => {
  try {
    await connectDB();
    const subjects = await Subject.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: subjects
    });
  } catch (error) {
    console.error('Get Subjects Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/admin/subjects
// @desc    Create a new subject
// @access  Private (Admin only)
router.post('/subjects', protect, authorize('admin'), async (req, res) => {
  try {
    await connectDB();
    const subject = await Subject.create(req.body);

    res.status(201).json({
      success: true,
      data: subject
    });
  } catch (error) {
    console.error('Create Subject Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ FEE MANAGEMENT ============

// @route   GET /api/admin/fees
// @desc    Get all fees
// @access  Private (Admin/Principal only)
router.get('/fees', protect, authorize('admin', 'principal'), async (req, res) => {
  try {
    await connectDB();
    const { status, class: classId } = req.query;

    let query = {};
    if (status) query.status = status;
    if (classId) {
      const students = await Student.find({ class: classId }).select('_id');
      query.student = { $in: students.map(s => s._id) };
    }

    const fees = await Fee.find(query)
      .populate('student', 'user rollNumber')
      .populate('student.user', 'firstName lastName')
      .populate('class', 'name section');

    // Calculate statistics
    const totalFees = fees.reduce((sum, f) => sum + f.amount, 0);
    const totalPaid = fees.reduce((sum, f) => sum + f.paidAmount, 0);
    const totalPending = totalFees - totalPaid;

    res.status(200).json({
      success: true,
      data: {
        fees,
        stats: {
          totalFees,
          totalPaid,
          totalPending,
          count: fees.length,
          paidCount: fees.filter(f => f.status === 'paid').length,
          pendingCount: fees.filter(f => f.status === 'pending' || f.status === 'overdue').length
        }
      }
    });
  } catch (error) {
    console.error('Get Fees Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/admin/fees
// @desc    Create fee record
// @access  Private (Admin only)
router.post('/fees', protect, authorize('admin'), async (req, res) => {
  try {
    await connectDB();
    const feeData = {
      ...req.body,
      createdBy: req.user.id
    };
    const fee = await Fee.create(feeData);

    res.status(201).json({
      success: true,
      data: fee
    });
  } catch (error) {
    console.error('Create Fee Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ SETTINGS ============

// @route   GET /api/admin/settings
// @desc    Get all settings
// @access  Private (Admin/Principal only)
router.get('/settings', protect, authorize('admin', 'principal'), async (req, res) => {
  try {
    await connectDB();
    const settings = await Settings.find();

    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });

    res.status(200).json({
      success: true,
      data: settingsMap
    });
  } catch (error) {
    console.error('Get Settings Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/admin/settings
// @desc    Update settings
// @access  Private (Admin only)
router.put('/settings', protect, authorize('admin'), async (req, res) => {
  try {
    await connectDB();
    const settings = req.body;

    const updates = Object.keys(settings).map(async (key) => {
      return Settings.findOneAndUpdate(
        { key },
        { 
          value: settings[key],
          updatedBy: req.user.id
        },
        { upsert: true, new: true }
      );
    });

    await Promise.all(updates);

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Update Settings Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ NOTIFICATIONS ============

// @route   POST /api/admin/notifications
// @desc    Create notification
// @access  Private (Admin/Principal only)
router.post('/notifications', protect, authorize('admin', 'principal'), async (req, res) => {
  try {
    await connectDB();
    const notificationData = {
      ...req.body,
      createdBy: req.user.id
    };
    const notification = await Notification.create(notificationData);

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Create Notification Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ DASHBOARD STATS ============

// @route   GET /api/admin/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private (Admin/Principal only)
router.get('/dashboard/stats', protect, authorize('admin', 'principal'), async (req, res) => {
  try {
    await connectDB();
    const [
      totalUsers,
      totalStudents,
      totalTeachers,
      totalAdmins,
      totalClasses,
      totalSubjects,
      totalFeesCollected,
      pendingFees
    ] = await Promise.all([
      User.countDocuments(),
      Student.countDocuments(),
      Teacher.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      Class.countDocuments(),
      Subject.countDocuments(),
      Fee.aggregate([
        { $group: { _id: null, total: { $sum: '$paidAmount' } } }
      ]),
      Fee.countDocuments({ status: { $in: ['pending', 'overdue'] } })
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          students: totalStudents,
          teachers: totalTeachers,
          admins: totalAdmins
        },
        academics: {
          totalClasses,
          totalSubjects
        },
        finance: {
          totalFeesCollected: totalFeesCollected[0]?.total || 0,
          pendingFees
        }
      }
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;