// ============================================================
// EDUSPHERE - Backend Server (VERCEL OPTIMIZED)
// ============================================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ============================================================
// ENVIRONMENT VARIABLES
// ============================================================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://thakurprashant9720_db_user:CZ3SKvgHdyPyAkM5@cluster0.zlfum93.mongodb.net/?appName=Cluster0';
const JWT_SECRET = process.env.JWT_SECRET || 'edusphere_super_secret_key_2024_secure';

// ============================================================
// MODELS
// ============================================================
let User, Course, Fee, Attendance, Assignment, Notification, Settings;

// ============================================================
// EXPRESS APP
// ============================================================
const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// ROOT ROUTE
// ============================================================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'EduSphere API is running!',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      login: '/api/auth/login',
      users: '/api/users',
      courses: '/api/courses',
      fees: '/api/fees',
      attendance: '/api/attendance',
      settings: '/api/settings',
      stats: '/api/dashboard/stats'
    }
  });
});

// ============================================================
// MONGODB CONNECTION (with retry)
// ============================================================
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB(retries = 3) {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('✅ MongoDB Connected!');
        
        // Load models
        User = require('./models/User');
        Course = require('./models/Course');
        Fee = require('./models/Fee');
        Attendance = require('./models/Attendance');
        Assignment = require('./models/Assignment');
        Notification = require('./models/Notification');
        Settings = require('./models/Settings');
        
        return mongoose;
      })
      .catch((err) => {
        console.error('❌ MongoDB Connection Error:', err.message);
        cached.promise = null;
        
        if (retries > 0) {
          console.log(`🔄 Retrying connection... (${retries} attempts left)`);
          return connectDB(retries - 1);
        }
        throw err;
      });
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}

// ============================================================
// INITIALIZE DATABASE
// ============================================================
async function initializeDatabase() {
  try {
    await connectDB();
    if (User) {
      const adminExists = await User.findOne({ role: 'admin' });
      if (!adminExists) {
        const admin = new User({
          firstName: 'Super',
          lastName: 'Admin',
          email: 'admin@edusphere.com',
          password: 'admin123',
          role: 'admin',
          status: 'active'
        });
        await admin.save();
        console.log('✅ Admin created!');
      }
    }
  } catch (err) {
    console.error('Init error:', err);
  }
}

// Call init on startup (non-blocking)
initializeDatabase();

// ============================================================
// AUTH MIDDLEWARE
// ============================================================
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    await connectDB();
    const decoded = jwt.verify(token, JWT_SECRET);
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
// HEALTH CHECK
// ============================================================
app.get('/api/health', async (req, res) => {
  try {
    await connectDB();
    res.json({
      success: true,
      message: 'EduSphere API is running',
      database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message,
      database: 'Disconnected'
    });
  }
});

// ============================================================
// AUTH ROUTES
// ============================================================
app.post('/api/auth/login', async (req, res) => {
  try {
    await connectDB();
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

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
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================================
// USER ROUTES
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
// ERROR HANDLER
// ============================================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// ============================================================
// EXPORT FOR VERCEL
// ============================================================
module.exports = app;