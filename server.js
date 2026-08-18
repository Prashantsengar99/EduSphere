// ============================================================
// EDUSPHERE - Backend Server (COMPLETE FINAL FIXED)
// ============================================================

require('dotenv').config();
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
// EXPRESS APP
// ============================================================
const app = express();

// ============================================================
// MIDDLEWARE - CORS FIXED
// ============================================================
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:5000', 'http://127.0.0.1:5000', '*'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.options('*', cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:5000', 'http://127.0.0.1:5000', '*'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// MONGODB CONNECTION
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
// ROOT ROUTE
// ============================================================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'EduSphere API is running!',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth',
      student: '/api/student',
      teacher: '/api/teacher',
      admin: '/api/admin',
      health: '/api/health'
    }
  });
});

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/api/health', async (req, res) => {
  try {
    await connectDB();
    res.json({
      success: true,
      message: 'EduSphere API is healthy',
      database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      environment: process.env.NODE_ENV || 'development'
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
    const User = require('./models/User');
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
  if (req.user.role !== 'admin' && req.user.role !== 'principal') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// ============================================================
// TEACHER STUDENT ROUTES
// ============================================================

app.get('/api/teacher/students', authMiddleware, authorize('teacher'), async (req, res) => {
  try {
    await connectDB();
    const Teacher = require('./models/Teacher');
    const Student = require('./models/Student');
    
    const teacher = await Teacher.findOne({ user: req.user.id });
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    let query = {};
    if (teacher.classes && teacher.classes.length > 0) {
      query.class = { $in: teacher.classes };
    }

    const students = await Student.find(query)
      .populate('user', 'firstName lastName email phone profileImage dateOfBirth gender')
      .populate('class', 'name section grade')
      .sort({ createdAt: -1 });

    console.log(`📚 Teacher ${teacher._id} has ${students.length} students`);

    res.status(200).json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Get Teacher Students Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/teacher/students/:id', authMiddleware, authorize('teacher'), async (req, res) => {
  try {
    await connectDB();
    const Student = require('./models/Student');
    
    const student = await Student.findById(req.params.id)
      .populate('user', 'firstName lastName email phone profileImage dateOfBirth gender address')
      .populate('class', 'name section grade');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Get Student Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/teacher/students', authMiddleware, authorize('teacher'), async (req, res) => {
  try {
    await connectDB();
    console.log('📝 RECEIVED DATA:', JSON.stringify(req.body, null, 2));
    
    const Teacher = require('./models/Teacher');
    const User = require('./models/User');
    const Student = require('./models/Student');
    const Class = require('./models/Class');
    const Notification = require('./models/Notification');
    
    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    const { 
      firstName, lastName, email, password, phone,
      rollNumber, parentName, parentPhone, parentEmail,
      classId, section, dateOfBirth, gender, address
    } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    let classDoc = null;
    
    if (classId) {
      try {
        const mongoose = require('mongoose');
        if (mongoose.Types.ObjectId.isValid(classId)) {
          classDoc = await Class.findById(classId);
          console.log('🔍 Found class by ID:', classDoc?.name);
        }
      } catch (err) {}

      if (!classDoc) {
        const classNumber = parseInt(classId);
        if (!isNaN(classNumber) && classNumber >= 1 && classNumber <= 12) {
          const className = `Class ${classNumber}`;
          console.log('🔍 Looking for class by name:', className);
          
          classDoc = await Class.findOne({ name: className });
          
          if (!classDoc) {
            classDoc = await Class.create({
              name: className,
              section: section || 'A',
              grade: classNumber,
              academicYear: '2024-2025',
              roomNumber: '101',
              capacity: 30
            });
            console.log('✅ New class created:', classDoc.name);
          }
        }
      }
    }

    if (!classDoc) {
      console.log('⚠️ No class found, using default Class 1');
      classDoc = await Class.findOne({ name: 'Class 1' });
      if (!classDoc) {
        classDoc = await Class.create({
          name: 'Class 1',
          section: section || 'A',
          grade: 1,
          academicYear: '2024-2025',
          roomNumber: '101',
          capacity: 30
        });
        console.log('✅ Default Class 1 created');
      }
    }

    console.log('📚 Using class:', classDoc.name, 'ID:', classDoc._id);

    user = await User.create({
      firstName, lastName, email, password,
      role: 'student',
      status: 'active',
      phone: phone || '',
      dateOfBirth: dateOfBirth || null,
      gender: gender || 'other',
      address: address || {},
      createdBy: req.user.id
    });

    console.log('✅ User created with ID:', user._id);

    const studentData = {
      user: user._id,
      rollNumber: rollNumber || `STU${Date.now().toString().slice(-6)}`,
      class: classDoc._id,
      section: section || 'A',
      parentName: parentName || 'Not Provided',
      parentPhone: parentPhone || 'Not Provided',
      parentEmail: parentEmail || '',
      admissionDate: new Date(),
      isActive: true
    };

    console.log('📝 Student Data being saved:', JSON.stringify(studentData, null, 2));

    const student = await Student.create(studentData);
    console.log('✅ Student profile created with ID:', student._id);
    console.log('✅ Student user reference:', student.user);

    await Class.findByIdAndUpdate(classDoc._id, {
      $push: { students: student._id }
    });
    console.log('✅ Student added to class');

    if (!teacher.classes.includes(classDoc._id)) {
      teacher.classes.push(classDoc._id);
      await teacher.save();
      console.log('✅ Class added to teacher');
    }

    const populatedStudent = await Student.findById(student._id)
      .populate('user', 'firstName lastName email phone profileImage')
      .populate('class', 'name section grade');

    console.log('✅ Final populated student:', JSON.stringify(populatedStudent, null, 2));

    await Notification.create({
      title: 'New Student Added',
      message: `${firstName} ${lastName} has been added to ${classDoc.name} - ${section}`,
      type: 'success',
      priority: 'medium',
      recipients: [req.user.id],
      createdBy: req.user.id,
      isGlobal: false
    });

    res.status(201).json({
      success: true,
      message: `✅ Student ${firstName} ${lastName} created successfully!`,
      data: populatedStudent
    });

  } catch (error) {
    console.error('❌ Create Student Error:', error);
    console.error('❌ Error Stack:', error.stack);
    
    if (error && req.body.email) {
      try {
        const User = require('./models/User');
        await User.findOneAndDelete({ email: req.body.email });
        console.log('🧹 Cleaned up: User deleted');
      } catch (cleanupErr) {
        console.error('Cleanup error:', cleanupErr);
      }
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create student'
    });
  }
});

app.put('/api/teacher/students/:id', authMiddleware, authorize('teacher'), async (req, res) => {
  try {
    await connectDB();
    const Teacher = require('./models/Teacher');
    const Student = require('./models/Student');
    const User = require('./models/User');
    const Class = require('./models/Class');
    
    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const { 
      firstName, lastName, phone, rollNumber,
      parentName, parentPhone, parentEmail, section,
      dateOfBirth, gender, address, classId
    } = req.body;

    if (firstName || lastName || phone || dateOfBirth || gender || address) {
      await User.findByIdAndUpdate(student.user, {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phone: phone || undefined,
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
        address: address || undefined
      });
    }

    if (classId) {
      let newClass = null;
      
      try {
        const mongoose = require('mongoose');
        if (mongoose.Types.ObjectId.isValid(classId)) {
          newClass = await Class.findById(classId);
        }
      } catch (err) {}

      if (!newClass) {
        const classNumber = parseInt(classId);
        if (!isNaN(classNumber) && classNumber >= 1 && classNumber <= 12) {
          const className = `Class ${classNumber}`;
          newClass = await Class.findOne({ name: className });
          if (!newClass) {
            newClass = await Class.create({
              name: className,
              section: section || 'A',
              grade: classNumber,
              academicYear: '2024-2025',
              roomNumber: '101',
              capacity: 30
            });
          }
        }
      }

      if (newClass && newClass._id.toString() !== student.class.toString()) {
        await Class.findByIdAndUpdate(student.class, {
          $pull: { students: student._id }
        });
        student.class = newClass._id;
        await Class.findByIdAndUpdate(newClass._id, {
          $push: { students: student._id }
        });
      }
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      {
        rollNumber: rollNumber || undefined,
        section: section || undefined,
        parentName: parentName || undefined,
        parentPhone: parentPhone || undefined,
        parentEmail: parentEmail || undefined
      },
      { new: true, runValidators: true }
    ).populate('user', 'firstName lastName email phone profileImage')
     .populate('class', 'name section grade');

    res.status(200).json({
      success: true,
      message: '✅ Student updated successfully!',
      data: updatedStudent
    });

  } catch (error) {
    console.error('Update Student Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.delete('/api/teacher/students/:id', authMiddleware, authorize('teacher'), async (req, res) => {
  try {
    await connectDB();
    const Teacher = require('./models/Teacher');
    const Student = require('./models/Student');
    const User = require('./models/User');
    const Class = require('./models/Class');
    
    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    await Class.findByIdAndUpdate(student.class, {
      $pull: { students: student._id }
    });

    const studentData = student.toObject();
    await student.deleteOne();
    
    if (studentData.user) {
      await User.findByIdAndDelete(studentData.user);
    }

    res.status(200).json({
      success: true,
      message: '✅ Student deleted successfully!'
    });

  } catch (error) {
    console.error('Delete Student Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/teacher/students/:id/grades', authMiddleware, authorize('teacher'), async (req, res) => {
  try {
    await connectDB();
    const Grade = require('./models/Grade');
    
    const grades = await Grade.find({ student: req.params.id })
      .populate('subject', 'name code')
      .sort({ examDate: -1 });

    res.status(200).json({
      success: true,
      data: grades
    });
  } catch (error) {
    console.error('Get Grades Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/teacher/students/:id/grades', authMiddleware, authorize('teacher'), async (req, res) => {
  try {
    await connectDB();
    const Student = require('./models/Student');
    const Grade = require('./models/Grade');
    
    const { subjectId, marksObtained, maxMarks, examType, examDate, semester, remarks } = req.body;
    const studentId = req.params.id;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (!subjectId || marksObtained === undefined || !examType || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields'
      });
    }

    let grade = await Grade.findOne({
      student: student._id,
      subject: subjectId,
      examType: examType,
      semester: semester
    });

    if (grade) {
      grade.marksObtained = marksObtained;
      grade.maxMarks = maxMarks || 100;
      grade.examDate = examDate || new Date();
      grade.remarks = remarks || '';
      grade.gradedBy = req.user.id;
      await grade.save();
    } else {
      grade = await Grade.create({
        student: student._id,
        subject: subjectId,
        class: student.class,
        examType,
        marksObtained,
        maxMarks: maxMarks || 100,
        examDate: examDate || new Date(),
        semester,
        remarks: remarks || '',
        gradedBy: req.user.id
      });
    }

    res.status(200).json({
      success: true,
      message: '✅ Grade saved successfully!',
      data: grade
    });

  } catch (error) {
    console.error('Save Grade Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/teacher/schedule', authMiddleware, authorize('teacher'), async (req, res) => {
  try {
    await connectDB();
    const Teacher = require('./models/Teacher');
    
    const teacher = await Teacher.findOne({ user: req.user.id })
      .populate('classes', 'name section schedule');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    
    let schedule = [];
    if (teacher.classes) {
      teacher.classes.forEach(cls => {
        if (cls.schedule && cls.schedule[today]) {
          cls.schedule[today].forEach(item => {
            schedule.push({
              time: item.time,
              subject: item.subject || 'Class',
              class: cls.name,
              section: cls.section,
              room: item.room || cls.roomNumber
            });
          });
        }
      });
    }

    res.status(200).json({
      success: true,
      data: { schedule }
    });
  } catch (error) {
    console.error('Get Schedule Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/teacher/activity', authMiddleware, authorize('teacher'), async (req, res) => {
  try {
    await connectDB();
    const Assignment = require('./models/Assignment');
    const Grade = require('./models/Grade');
    
    const activities = [];
    
    const assignments = await Assignment.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5);
    
    assignments.forEach(a => {
      activities.push({
        time: a.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: `📝 Assignment: ${a.title}`,
        desc: `Created for ${a.class?.name || 'class'}`
      });
    });

    const grades = await Grade.find({ gradedBy: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('student', 'user')
      .populate('student.user', 'firstName lastName');
    
    grades.forEach(g => {
      const name = g.student?.user?.firstName || 'Student';
      activities.push({
        time: g.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: `📊 Grade: ${name}`,
        desc: `${g.marksObtained}/${g.maxMarks} in ${g.examType}`
      });
    });

    activities.sort((a, b) => a.time.localeCompare(b.time));
    
    res.status(200).json({
      success: true,
      data: { activities: activities.slice(0, 10) }
    });
  } catch (error) {
    console.error('Get Activity Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/teacher/notices', authMiddleware, authorize('teacher'), async (req, res) => {
  try {
    await connectDB();
    const Notification = require('./models/Notification');
    
    const notices = await Notification.find({
      $or: [
        { recipients: req.user.id },
        { isGlobal: true },
        { roles: { $in: ['teacher', 'all'] } }
      ],
      expiresAt: { $gte: new Date() }
    })
    .sort({ createdAt: -1 })
    .limit(5);

    res.status(200).json({
      success: true,
      data: { notices: notices.map(n => ({
        title: n.title,
        message: n.message,
        type: n.type,
        date: n.createdAt,
        icon: n.type === 'success' ? '✅' : n.type === 'warning' ? '⚠️' : n.type === 'error' ? '❌' : '📌'
      })) }
    });
  } catch (error) {
    console.error('Get Notices Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================
// AUTH ROUTES
// ============================================================

app.post('/api/auth/register', async (req, res) => {
  try {
    await connectDB();
    const User = require('./models/User');
    const { firstName, lastName, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: role || 'student'
    });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({
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
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    await connectDB();
    const User = require('./models/User');
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive. Please contact admin.'
      });
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const User = require('./models/User');
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        address: user.address,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/auth/change-password', authMiddleware, async (req, res) => {
  try {
    const User = require('./models/User');
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    
    const isPasswordMatch = await user.comparePassword(currentPassword);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// STUDENT ROUTES
// ============================================================

app.get('/api/student/profile', authMiddleware, authorize('student'), async (req, res) => {
  try {
    await connectDB();
    const Student = require('./models/Student');
    const student = await Student.findOne({ user: req.user.id })
      .populate('user', 'firstName lastName email phone address dateOfBirth gender profileImage')
      .populate('class', 'name section grade academicYear roomNumber');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Get Student Profile Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/student/grades', authMiddleware, authorize('student'), async (req, res) => {
  try {
    await connectDB();
    const Student = require('./models/Student');
    const Grade = require('./models/Grade');
    
    const student = await Student.findOne({ user: req.user.id });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const grades = await Grade.find({ student: student._id })
      .populate('subject', 'name code')
      .populate('class', 'name section')
      .sort({ examDate: -1 });

    const totalSubjects = grades.length;
    const totalMarks = grades.reduce((sum, g) => sum + g.marksObtained, 0);
    const totalMaxMarks = grades.reduce((sum, g) => sum + g.maxMarks, 0);
    const overallPercentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        grades,
        stats: {
          totalSubjects,
          totalMarks,
          totalMaxMarks,
          overallPercentage: overallPercentage.toFixed(2),
          averagePercentage: grades.length > 0 ? (grades.reduce((sum, g) => sum + g.percentage, 0) / grades.length).toFixed(2) : 0
        }
      }
    });
  } catch (error) {
    console.error('Get Student Grades Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/student/attendance', authMiddleware, authorize('student'), async (req, res) => {
  try {
    await connectDB();
    const Student = require('./models/Student');
    const Attendance = require('./models/Attendance');
    
    const student = await Student.findOne({ user: req.user.id });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const attendance = await Attendance.find({ student: student._id })
      .populate('class', 'name section')
      .sort({ date: -1 });

    const totalDays = attendance.length;
    const presentDays = attendance.filter(a => a.status === 'present').length;
    const absentDays = attendance.filter(a => a.status === 'absent').length;
    const lateDays = attendance.filter(a => a.status === 'late').length;
    const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        attendance,
        stats: {
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          attendancePercentage: attendancePercentage.toFixed(2)
        }
      }
    });
  } catch (error) {
    console.error('Get Student Attendance Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/student/assignments', authMiddleware, authorize('student'), async (req, res) => {
  try {
    await connectDB();
    const Student = require('./models/Student');
    const Assignment = require('./models/Assignment');
    
    const student = await Student.findOne({ user: req.user.id });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const assignments = await Assignment.find({ class: student.class })
      .populate('subject', 'name code')
      .populate('createdBy', 'firstName lastName')
      .sort({ dueDate: 1 });

    const assignmentsWithStatus = assignments.map(assignment => {
      const submission = assignment.submissions.find(
        s => s.student && s.student.toString() === student._id.toString()
      );
      return {
        ...assignment.toObject(),
        submitted: !!submission,
        submissionStatus: submission ? submission.status : 'pending',
        marks: submission ? submission.marks : null,
        feedback: submission ? submission.feedback : null
      };
    });

    res.status(200).json({
      success: true,
      data: assignmentsWithStatus
    });
  } catch (error) {
    console.error('Get Student Assignments Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/student/assignments/:id/submit', authMiddleware, authorize('student'), async (req, res) => {
  try {
    await connectDB();
    const Student = require('./models/Student');
    const Assignment = require('./models/Assignment');
    const { fileUrl, remarks } = req.body;
    
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    if (assignment.class.toString() !== student.class.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this class'
      });
    }

    const existingSubmission = assignment.submissions.find(
      s => s.student && s.student.toString() === student._id.toString()
    );

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted this assignment'
      });
    }

    assignment.submissions.push({
      student: student._id,
      submittedAt: new Date(),
      fileUrl,
      remarks,
      status: 'submitted'
    });

    await assignment.save();

    res.status(200).json({
      success: true,
      message: 'Assignment submitted successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Submit Assignment Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/student/fees', authMiddleware, authorize('student'), async (req, res) => {
  try {
    await connectDB();
    const Student = require('./models/Student');
    const Fee = require('./models/Fee');
    
    const student = await Student.findOne({ user: req.user.id });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const fees = await Fee.find({ student: student._id })
      .populate('class', 'name section')
      .sort({ dueDate: 1 });

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
          feesPaid: fees.filter(f => f.status === 'paid').length,
          feesPending: fees.filter(f => f.status === 'pending' || f.status === 'overdue').length
        }
      }
    });
  } catch (error) {
    console.error('Get Student Fees Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// TEACHER ROUTES (Other than students)
// ============================================================

app.get('/api/teacher/profile', authMiddleware, authorize('teacher'), async (req, res) => {
  try {
    await connectDB();
    const Teacher = require('./models/Teacher');
    const teacher = await Teacher.findOne({ user: req.user.id })
      .populate('user', 'firstName lastName email phone address dateOfBirth gender profileImage')
      .populate('subjects', 'name code')
      .populate('classes', 'name section grade');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: teacher
    });
  } catch (error) {
    console.error('Get Teacher Profile Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/teacher/classes', authMiddleware, authorize('teacher'), async (req, res) => {
  try {
    await connectDB();
    const Teacher = require('./models/Teacher');
    const Class = require('./models/Class');
    const Student = require('./models/Student');
    
    const teacher = await Teacher.findOne({ user: req.user.id });
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    const classes = await Class.find({ _id: { $in: teacher.classes } })
      .populate('students', 'user rollNumber')
      .populate('classTeacher', 'user')
      .populate('subjects.subject', 'name code');

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
    console.error('Get Teacher Classes Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/teacher/assignments', authMiddleware, authorize('teacher'), async (req, res) => {
  try {
    await connectDB();
    const Assignment = require('./models/Assignment');
    const Student = require('./models/Student');
    
    const assignments = await Assignment.find({ createdBy: req.user.id })
      .populate('class', 'name section grade')
      .populate('subject', 'name code')
      .sort({ createdAt: -1 });

    const assignmentsWithStats = await Promise.all(assignments.map(async (assignment) => {
      const totalStudents = await Student.countDocuments({ class: assignment.class });
      const submittedCount = assignment.submissions.filter(s => s.status === 'submitted').length;
      const gradedCount = assignment.submissions.filter(s => s.status === 'graded').length;

      return {
        ...assignment.toObject(),
        stats: {
          totalStudents,
          submittedCount,
          gradedCount,
          pendingCount: totalStudents - submittedCount
        }
      };
    }));

    res.status(200).json({
      success: true,
      data: assignmentsWithStats
    });
  } catch (error) {
    console.error('Get Teacher Assignments Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// ADMIN ROUTES
// ============================================================

// @route   GET /api/admin/users
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const User = require('./models/User');
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/admin/users
app.post('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const User = require('./models/User');
    const Teacher = require('./models/Teacher');
    
    const { firstName, lastName, email, password, phone, qualification, department, role, status } = req.body;

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
      phone: phone || '',
      createdBy: req.user.id
    });

    console.log('✅ User created:', user._id);

    if (role === 'teacher') {
      await Teacher.create({
        user: user._id,
        employeeId: `TCH${Date.now().toString().slice(-6)}`,
        qualification: qualification || 'N/A',
        department: department || 'General',
        designation: 'Teacher',
        experience: 0,
        joiningDate: new Date(),
        isActive: true
      });
      console.log('✅ Teacher profile created for:', email);
    }

    res.status(201).json({
      success: true,
      data: user,
      message: role === 'teacher' ? 'Teacher added successfully!' : 'User created successfully!'
    });

  } catch (error) {
    console.error('❌ Create User Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/admin/users/:id
app.put('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const User = require('./models/User');
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/admin/users/:id
app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const User = require('./models/User');
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

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
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// CLASS ROUTES
// ============================================================

// @route   GET /api/admin/classes
app.get('/api/admin/classes', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const Class = require('./models/Class');
    const Student = require('./models/Student');
    
    const classes = await Class.find()
      .populate('classTeacher', 'user')
      .populate('classTeacher.user', 'firstName lastName')
      .populate('students', 'user rollNumber')
      .populate('subjects.subject', 'name code')
      .populate('subjects.teacher', 'user')
      .populate('subjects.teacher.user', 'firstName lastName');

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
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/admin/classes
app.post('/api/admin/classes', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const Class = require('./models/Class');
    const classData = req.body;
    const newClass = await Class.create(classData);

    res.status(201).json({
      success: true,
      data: newClass
    });
  } catch (error) {
    console.error('Create Class Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/admin/classes/:id
app.put('/api/admin/classes/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const Class = require('./models/Class');
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// ✅ FIXED: PUT /api/admin/classes/:id/teacher - Assign Class Teacher
// ============================================================
app.put('/api/admin/classes/:id/teacher', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const Class = require('./models/Class');
    const Teacher = require('./models/Teacher');
    
    const { teacherId } = req.body;
    const classId = req.params.id;

    console.log('📝 Assign Class Teacher - Class ID:', classId, 'Teacher ID:', teacherId);

    if (!teacherId) {
      return res.status(400).json({
        success: false,
        message: 'Teacher ID is required'
      });
    }

    // Check if class exists
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check if teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Update class with class teacher
    classDoc.classTeacher = teacherId;
    await classDoc.save();

    // Also add class to teacher's classes array if not already
    if (!teacher.classes.includes(classId)) {
      teacher.classes.push(classId);
      await teacher.save();
    }

    const updatedClass = await Class.findById(classId)
      .populate('classTeacher', 'user')
      .populate('classTeacher.user', 'firstName lastName email');

    res.status(200).json({
      success: true,
      message: '✅ Class teacher assigned successfully!',
      data: updatedClass
    });

  } catch (error) {
    console.error('❌ Assign Class Teacher Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================
// ✅ FIXED: DELETE /api/admin/classes/:id/teacher - Remove Class Teacher
// ============================================================
app.delete('/api/admin/classes/:id/teacher', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const Class = require('./models/Class');
    const Teacher = require('./models/Teacher');
    
    const classId = req.params.id;

    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Remove class teacher reference from class
    const teacherId = classDoc.classTeacher;
    classDoc.classTeacher = null;
    await classDoc.save();

    // Remove class from teacher's classes array
    if (teacherId) {
      await Teacher.findByIdAndUpdate(teacherId, {
        $pull: { classes: classId }
      });
    }

    res.status(200).json({
      success: true,
      message: '✅ Class teacher removed successfully!'
    });

  } catch (error) {
    console.error('❌ Remove Class Teacher Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/admin/classes/:id
app.delete('/api/admin/classes/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const Class = require('./models/Class');
    const Student = require('./models/Student');
    
    const classToDelete = await Class.findById(req.params.id);

    if (!classToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

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
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// STUDENT & TEACHER ROUTES
// ============================================================

// @route   GET /api/admin/students
app.get('/api/admin/students', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const Student = require('./models/Student');
    
    const students = await Student.find()
      .populate('user', 'firstName lastName email phone profileImage')
      .populate('class', 'name section grade')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Get Students Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/admin/students
app.post('/api/admin/students', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const User = require('./models/User');
    const Student = require('./models/Student');
    const Class = require('./models/Class');
    
    const { firstName, lastName, email, password, phone, classId, section, parentName, parentPhone, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    let classDoc = null;
    if (classId) {
      const classNumber = parseInt(classId);
      if (!isNaN(classNumber) && classNumber >= 1 && classNumber <= 12) {
        const className = `Class ${classNumber}`;
        classDoc = await Class.findOne({ name: className });
        if (!classDoc) {
          classDoc = await Class.create({
            name: className,
            section: section || 'A',
            grade: classNumber,
            academicYear: '2024-2025',
            roomNumber: '101',
            capacity: 30
          });
        }
      }
    }
    if (!classDoc) {
      classDoc = await Class.findOne({ name: 'Class 1' });
      if (!classDoc) {
        classDoc = await Class.create({
          name: 'Class 1',
          section: 'A',
          grade: 1,
          academicYear: '2024-2025',
          roomNumber: '101',
          capacity: 30
        });
      }
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: password || 'password123',
      role: role || 'student',
      status: 'active',
      phone: phone || '',
      createdBy: req.user.id
    });

    console.log('✅ User created:', user._id);

    await Student.create({
      user: user._id,
      rollNumber: `STU${Date.now().toString().slice(-6)}`,
      class: classDoc._id,
      section: section || 'A',
      parentName: parentName || 'Not Provided',
      parentPhone: parentPhone || 'Not Provided',
      admissionDate: new Date(),
      isActive: true
    });
    console.log('✅ Student profile created for:', email);

    res.status(201).json({
      success: true,
      data: user,
      message: 'Student added successfully!'
    });

  } catch (error) {
    console.error('❌ Create Student Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/admin/students/:id
app.delete('/api/admin/students/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const Student = require('./models/Student');
    const User = require('./models/User');
    const Class = require('./models/Class');
    
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    await Class.findByIdAndUpdate(student.class, {
      $pull: { students: student._id }
    });

    const userId = student.user;
    await student.deleteOne();
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: '✅ Student deleted successfully!'
    });

  } catch (error) {
    console.error('Delete Student Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/admin/teachers
app.get('/api/admin/teachers', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const Teacher = require('./models/Teacher');
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/admin/teachers/:id
app.delete('/api/admin/teachers/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const Teacher = require('./models/Teacher');
    const User = require('./models/User');
    
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    const userId = teacher.user;
    await teacher.deleteOne();
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: '✅ Teacher deleted successfully!'
    });

  } catch (error) {
    console.error('Delete Teacher Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/admin/teachers/:id
app.put('/api/admin/teachers/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const Teacher = require('./models/Teacher');
    const User = require('./models/User');
    
    const { firstName, lastName, email, phone, qualification, department, experience, status } = req.body;

    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    if (firstName || lastName || email || phone) {
      await User.findByIdAndUpdate(teacher.user, {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        email: email || undefined,
        phone: phone || undefined
      });
    }

    if (qualification) teacher.qualification = qualification;
    if (department) teacher.department = department;
    if (experience !== undefined) teacher.experience = experience;
    if (status !== undefined) teacher.isActive = status === 'active';

    await teacher.save();

    const updatedTeacher = await Teacher.findById(teacher._id)
      .populate('user', 'firstName lastName email phone profileImage');

    res.status(200).json({
      success: true,
      message: '✅ Teacher updated successfully!',
      data: updatedTeacher
    });

  } catch (error) {
    console.error('Update Teacher Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/admin/teachers/:id/toggle
app.put('/api/admin/teachers/:id/toggle', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const Teacher = require('./models/Teacher');
    
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    teacher.isActive = !teacher.isActive;
    await teacher.save();

    res.status(200).json({
      success: true,
      message: `Teacher ${teacher.isActive ? 'activated' : 'deactivated'}!`,
      data: teacher
    });

  } catch (error) {
    console.error('Toggle Teacher Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// OTHER ADMIN ROUTES
// ============================================================

// @route   GET /api/admin/subjects
app.get('/api/admin/subjects', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const Subject = require('./models/Subject');
    const subjects = await Subject.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: subjects
    });
  } catch (error) {
    console.error('Get Subjects Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/admin/subjects
app.post('/api/admin/subjects', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const Subject = require('./models/Subject');
    const subject = await Subject.create(req.body);

    res.status(201).json({
      success: true,
      data: subject
    });
  } catch (error) {
    console.error('Create Subject Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/admin/fees
app.get('/api/admin/fees', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const Fee = require('./models/Fee');
    const Student = require('./models/Student');
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/admin/fees
app.post('/api/admin/fees', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const Fee = require('./models/Fee');
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/admin/settings
app.get('/api/admin/settings', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const Settings = require('./models/Settings');
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/admin/settings
app.put('/api/admin/settings', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const Settings = require('./models/Settings');
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/admin/notifications
app.post('/api/admin/notifications', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const Notification = require('./models/Notification');
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/admin/dashboard/stats
app.get('/api/admin/dashboard/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const User = require('./models/User');
    const Student = require('./models/Student');
    const Teacher = require('./models/Teacher');
    const Class = require('./models/Class');
    const Subject = require('./models/Subject');
    const Fee = require('./models/Fee');
    
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
    res.status(500).json({ success: false, message: error.message });
  }
});
// ============================================================
// LEGACY ROUTES (Backward Compatibility)
// ============================================================

app.get('/api/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const User = require('./models/User');
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const User = require('./models/User');
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
    const User = require('./models/User');
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
    const User = require('./models/User');
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
    const User = require('./models/User');
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

app.get('/api/courses', authMiddleware, async (req, res) => {
  try {
    await connectDB();
    const Class = require('./models/Class');
    const courses = await Class.find()
      .populate('classTeacher', 'user')
      .populate('classTeacher.user', 'firstName lastName');
    res.json({ success: true, courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/dashboard/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await connectDB();
    const User = require('./models/User');
    const Fee = require('./models/Fee');
    
    const [
      totalUsers,
      totalStudents,
      totalTeachers,
      totalAdmins,
      totalFees
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'admin' }),
      Fee.aggregate([{ $group: { _id: null, total: { $sum: '$paidAmount' } } }])
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalStudents,
        totalTeachers,
        totalAdmins,
        totalCourses: 0,
        totalFeesCollected: totalFees[0]?.total || 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// FORM ROUTES
// ============================================================
app.use('/api/contact', require('./routes/contact'));
app.use('/api/enquiry', require('./routes/enquiry'));
app.use('/api/admission', require('./routes/admission'));

// ============================================================
// ROUTES (Import from routes folder)
// ============================================================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/student', require('./routes/student'));
app.use('/api/teacher', require('./routes/teacher'));
app.use('/api/admin', require('./routes/admin'));

// ============================================================
// DEBUG ROUTE
// ============================================================
app.get('/api/debug/students', authMiddleware, async (req, res) => {
  try {
    await connectDB();
    const Student = require('./models/Student');
    const User = require('./models/User');
    
    const allStudents = await Student.find()
      .populate('user', 'firstName lastName email')
      .populate('class', 'name section');
    
    const allUsers = await User.find({ role: 'student' })
      .select('firstName lastName email');
    
    res.json({
      success: true,
      data: {
        studentCount: allStudents.length,
        students: allStudents.map(s => ({
          id: s._id,
          name: s.user?.firstName + ' ' + s.user?.lastName || 'No user linked',
          email: s.user?.email || 'No email',
          class: s.class?.name || 'No class',
          hasUser: !!s.user,
          userRef: s.user?._id || null
        })),
        userCount: allUsers.length,
        users: allUsers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// INITIALIZE DATABASE
// ============================================================
async function initializeDatabase() {
  try {
    await connectDB();
    const User = require('./models/User');

    const defaultUsers = [
      { firstName: 'Super', lastName: 'Admin', email: 'admin@edusphere.com', password: 'admin123', role: 'admin', status: 'active' },
      { firstName: 'Principal', lastName: 'User', email: 'principal@edusphere.com', password: 'principal123', role: 'principal', status: 'active' },
      { firstName: 'Demo', lastName: 'Teacher', email: 'teacher@edusphere.com', password: 'teacher123', role: 'teacher', status: 'active' },
      { firstName: 'Demo', lastName: 'Student', email: 'student@edusphere.com', password: 'student123', role: 'student', status: 'active' }
    ];

    for (const userData of defaultUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        console.log(`✅ ${userData.role.charAt(0).toUpperCase() + userData.role.slice(1)} created: ${userData.email}`);
      }
    }

    console.log('\n🎯 Default Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👑 Admin      : admin@edusphere.com / admin123');
    console.log('👨‍💼 Principal  : principal@edusphere.com / principal123');
    console.log('👨‍🏫 Teacher   : teacher@edusphere.com / teacher123');
    console.log('🧑‍🎓 Student   : student@edusphere.com / student123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (err) {
    console.error('❌ Init error:', err);
  }
}

initializeDatabase();

// ============================================================
// ERROR HANDLER
// ============================================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ success: false, message: err.message || 'Something went wrong!' });
});

// ============================================================
// 🔥 FIXED: START SERVER - Render ke liye (PORT already declared at top)
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
  console.log(`🔍 Debug: http://localhost:${PORT}/api/debug/students`);
});

// ============================================================
// EXPORT FOR VERCEL
// ============================================================
module.exports = app;