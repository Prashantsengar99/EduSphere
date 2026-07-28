// ============================================================
// EDUSPHERE - Backend Server (Vercel Compatible)
// ============================================================

// Load environment variables
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ============================================================
// IMPORT MODELS
// ============================================================
const User = require('./models/User');
const Course = require('./models/Course');
const Fee = require('./models/Fee');
const Attendance = require('./models/Attendance');
const Assignment = require('./models/Assignment');
const Notification = require('./models/Notification');
const Settings = require('./models/Settings');

// ============================================================
// EXPRESS APP
// ============================================================
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// MONGODB CONNECTION - FIXED FOR VERCEL
// ============================================================
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
  // Don't crash on Vercel, just log error
}

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('✅ Using existing database connection');
    return;
  }

  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Initialize database after connection
    await initializeDatabase();
    
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Don't crash on Vercel, just log error
    isConnected = false;
  }
};

// ============================================================
// INITIALIZE DATABASE
// ============================================================
const initializeDatabase = async () => {
  try {
    // Check if admin exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const admin = new User({
        firstName: 'Super',
        lastName: 'Admin',
        email: process.env.ADMIN_EMAIL || 'admin@edusphere.com',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        role: 'admin',
        status: 'active'
      });
      await admin.save();
      console.log('✅ Default admin created!');
      console.log(`📧 Admin Email: ${admin.email}`);
    }

    // Check settings
    const settingsExists = await Settings.findOne({ key: 'school_name' });
    if (!settingsExists) {
      const defaultSettings = [
        { key: 'school_name', value: 'EduSphere' },
        { key: 'academic_year', value: '2024-25' },
        { key: 'default_password', value: 'password123' },
        { key: 'registration_status', value: 'disabled' }
      ];
      await Settings.insertMany(defaultSettings);
      console.log('✅ Default settings created!');
    }

    console.log('🚀 Database initialized!');
  } catch (err) {
    console.error('❌ Init Error:', err);
  }
};

// Connect to database on startup
connectDB();

// ============================================================
// JWT AUTH MIDDLEWARE
// ============================================================
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

// ============================================================
// AUTH ROUTES
// ============================================================
app.post('/api/auth/login', async (req, res) => {
  try {
    // Ensure database is connected
    await connectDB();
    
    const { email, password } = req.body;
    console.log('🔐 Login attempt:', email);
    
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status === 'inactive') {
      return res.status(401).json({ success: false, message: 'Account is inactive' });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get current user
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// ============================================================
// USER ROUTES (Admin Only)
// ============================================================
app.get('/api/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const { firstName, lastName, email, password, role, status } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = new User({
      firstName,
      lastName,
      email,
      password: password || 'password123',
      role: role || 'student',
      status: status || 'active',
      createdBy: req.user._id
    });

    await user.save();

    // Create notification
    const notification = new Notification({
      user: user._id,
      title: 'Welcome to EduSphere!',
      message: `Welcome ${user.firstName}! Your account has been created.`,
      type: 'success'
    });
    await notification.save();

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const { firstName, lastName, email, role, status } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, email, role, status },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot delete last admin' });
      }
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/users/:id/reset-password', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be 6+ characters' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// COURSE ROUTES
// ============================================================
app.get('/api/courses', authMiddleware, async (req, res) => {
  try {
    await connectDB();
    const courses = await Course.find()
      .populate('teacher', 'firstName lastName email')
      .populate('students', 'firstName lastName email');
    res.json({ success: true, courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/courses', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const course = new Course(req.body);
    await course.save();
    res.status(201).json({ success: true, course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/courses/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    res.json({ success: true, course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/courses/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    await Course.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// FEE ROUTES
// ============================================================
app.get('/api/fees', authMiddleware, async (req, res) => {
  try {
    await connectDB();
    const fees = await Fee.find()
      .populate('student', 'firstName lastName email')
      .populate('course', 'name code');
    res.json({ success: true, fees });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/fees', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const fee = new Fee(req.body);
    await fee.save();
    res.status(201).json({ success: true, fee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/fees/:id/pay', authMiddleware, async (req, res) => {
  try {
    await connectDB();
    const { amount, method, transactionId } = req.body;
    const fee = await Fee.findById(req.params.id);
    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee not found' });
    }

    fee.paidAmount += amount;
    fee.payments.push({ amount, method, transactionId });
    await fee.save();

    res.json({ success: true, fee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// ATTENDANCE ROUTES
// ============================================================
app.get('/api/attendance', authMiddleware, async (req, res) => {
  try {
    await connectDB();
    const attendance = await Attendance.find()
      .populate('student', 'firstName lastName email')
      .populate('course', 'name code');
    res.json({ success: true, attendance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/attendance', authMiddleware, async (req, res) => {
  try {
    await connectDB();
    const { student, course, date, status } = req.body;
    const attendance = await Attendance.findOneAndUpdate(
      { student, course, date: new Date(date) },
      { status, markedBy: req.user._id },
      { new: true, upsert: true }
    );
    res.json({ success: true, attendance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// DASHBOARD STATS
// ============================================================
app.get('/api/dashboard/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const [
      totalUsers,
      totalStudents,
      totalTeachers,
      totalAdmins,
      totalCourses,
      totalFees
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'admin' }),
      Course.countDocuments(),
      Fee.aggregate([{ $group: { _id: null, total: { $sum: '$paidAmount' } } }])
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalStudents,
        totalTeachers,
        totalAdmins,
        totalCourses,
        totalFeesCollected: totalFees[0]?.total || 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// SETTINGS ROUTES
// ============================================================
app.get('/api/settings', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const settings = await Settings.find();
    const settingsObj = {};
    settings.forEach(s => settingsObj[s.key] = s.value);
    res.json({ success: true, settings: settingsObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/settings', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    for (const [key, value] of Object.entries(req.body)) {
      await Settings.findOneAndUpdate(
        { key },
        { value },
        { upsert: true, new: true }
      );
    }
    res.json({ success: true, message: 'Settings updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/api/health', async (req, res) => {
  try {
    // Check MongoDB connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    
    res.json({
      success: true,
      message: 'EduSphere API is running',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// ============================================================
// ERROR HANDLER
// ============================================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// ============================================================
// EXPORT FOR VERCEL
// ============================================================
// This is the key for Vercel serverless deployment
module.exports = app;

// ============================================================
// START SERVER (Local)
// ============================================================
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📧 Admin: ${process.env.ADMIN_EMAIL || 'admin@edusphere.com'}`);
    console.log(`📊 Database: MongoDB Atlas`);
  });
}