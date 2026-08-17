const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const User = require('../models/User');
const Class = require('../models/Class');
const Assignment = require('../models/Assignment');
const Attendance = require('../models/Attendance');
const Grade = require('../models/Grade');
const Notification = require('../models/Notification');
const connectDB = require('../config/db');

// ============================================================
// ✅ FIXED: GET ALL STUDENTS (with teacher filter)
// ============================================================
router.get('/students', protect, authorize('teacher'), async (req, res) => {
  try {
    await connectDB();
    const teacher = await Teacher.findOne({ user: req.user.id });
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // 🔥 FIX: Sirf teacher ke classes ke students dikhao
    const students = await Student.find({ 
      class: { $in: teacher.classes } 
    })
    .populate('user', 'firstName lastName email phone profileImage dateOfBirth gender')
    .populate('class', 'name section grade')
    .sort({ createdAt: -1 });

    console.log(`📚 Found ${students.length} students for teacher`);

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
// ✅ FIXED: GET SINGLE STUDENT
// ============================================================
router.get('/students/:id', protect, authorize('teacher'), async (req, res) => {
  try {
    await connectDB();
    const teacher = await Teacher.findOne({ user: req.user.id });
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

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

// ============================================================
// ✅ FIXED: CREATE STUDENT (User + Student dono mein save)
// ============================================================
router.post('/students', protect, authorize('teacher'), async (req, res) => {
  try {
    await connectDB();
    console.log('📝 RECEIVED DATA:', req.body);
    
    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      phone,
      rollNumber,
      parentName,
      parentPhone,
      parentEmail,
      classId,        // 🔥 Class ID ya Class Number (1-12)
      section,
      dateOfBirth,
      gender,
      address
    } = req.body;

    // 1️⃣ Validation
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

    // 2️⃣ Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // 3️⃣ ✅ FIXED: Find or Create Class
    let classDoc = null;
    
    // 🔥 Agar classId number hai (1-12) toh Class name se find karo
    if (classId) {
      // Try to find by ID first
      try {
        const mongoose = require('mongoose');
        if (mongoose.Types.ObjectId.isValid(classId)) {
          classDoc = await Class.findById(classId);
        }
      } catch (err) {
        // ID valid nahi hai, ignore
      }

      // 🔥 Agar ID se nahi mila, toh number/name se try karo
      if (!classDoc) {
        const classNumber = parseInt(classId);
        if (!isNaN(classNumber) && classNumber >= 1 && classNumber <= 12) {
          const className = `Class ${classNumber}`;
          console.log('🔍 Looking for class:', className);
          
          classDoc = await Class.findOne({ name: className });
          
          // 🔥 Agar class exist nahi karti toh CREATE karo
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

    // 🔥 Agar class nahi mili, default Class 1 use karo
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

    // 4️⃣ Create User
    user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: 'student',
      status: 'active',
      phone: phone || '',
      dateOfBirth: dateOfBirth || null,
      gender: gender || 'other',
      address: address || {},
      createdBy: req.user.id
    });

    console.log('✅ User created:', user._id);

    // 5️⃣ ✅ FIXED: Create Student Profile
    const studentData = {
      user: user._id,
      rollNumber: rollNumber || `STU${Date.now().toString().slice(-6)}`,
      class: classDoc._id,  // 🔥 REAL ObjectId
      section: section || 'A',
      parentName: parentName || 'Not Provided',
      parentPhone: parentPhone || 'Not Provided',
      parentEmail: parentEmail || '',
      admissionDate: new Date(),
      isActive: true
    };

    console.log('📝 Student Data:', studentData);

    const student = await Student.create(studentData);
    console.log('✅ Student profile created:', student._id);

    // 6️⃣ Add student to class
    classDoc.students.push(student._id);
    await classDoc.save();

    // 7️⃣ Populate student with user data
    await student.populate('user', 'firstName lastName email phone profileImage');

    // 8️⃣ Send notification
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
      data: student
    });

  } catch (error) {
    console.error('❌ Create Student Error:', error);
    console.error('❌ Error Stack:', error.stack);
    
    // Cleanup: Delete user if student creation fails
    if (error && req.body.email) {
      await User.findOneAndDelete({ email: req.body.email });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create student'
    });
  }
});

// ============================================================
// ✅ FIXED: UPDATE STUDENT
// ============================================================
router.put('/students/:id', protect, authorize('teacher'), async (req, res) => {
  try {
    await connectDB();
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
      firstName, 
      lastName, 
      phone,
      rollNumber,
      parentName,
      parentPhone,
      parentEmail,
      section,
      dateOfBirth,
      gender,
      address,
      classId  // 🔥 Class update bhi ho sakta hai
    } = req.body;

    // 1️⃣ Update User
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

    // 2️⃣ Update Class if changed
    if (classId) {
      let newClass = null;
      
      // Try by ID
      try {
        const mongoose = require('mongoose');
        if (mongoose.Types.ObjectId.isValid(classId)) {
          newClass = await Class.findById(classId);
        }
      } catch (err) {}

      // Try by name/number
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
        // Remove from old class
        await Class.findByIdAndUpdate(student.class, {
          $pull: { students: student._id }
        });
        // Add to new class
        student.class = newClass._id;
        await Class.findByIdAndUpdate(newClass._id, {
          $push: { students: student._id }
        });
      }
    }

    // 3️⃣ Update Student
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

// ============================================================
// ✅ FIXED: DELETE STUDENT
// ============================================================
router.delete('/students/:id', protect, authorize('teacher'), async (req, res) => {
  try {
    await connectDB();
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

    // 1️⃣ Remove from class
    await Class.findByIdAndUpdate(student.class, {
      $pull: { students: student._id }
    });

    // 2️⃣ Delete Student
    const studentData = student.toObject();
    await student.deleteOne();

    // 3️⃣ Delete User
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

// ============================================================
// ✅ FIXED: GRADES ENDPOINTS
// ============================================================

// GET grades for a student
router.get('/students/:id/grades', protect, authorize('teacher'), async (req, res) => {
  try {
    await connectDB();
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

// POST - Add grade
router.post('/students/:id/grades', protect, authorize('teacher'), async (req, res) => {
  try {
    await connectDB();
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

// ============================================================
// PROFILE, CLASSES, ASSIGNMENTS, ATTENDANCE
// ============================================================

// @route   GET /api/teacher/profile
router.get('/profile', protect, authorize('teacher'), async (req, res) => {
  try {
    await connectDB();
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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/teacher/classes
router.get('/classes', protect, authorize('teacher'), async (req, res) => {
  try {
    await connectDB();
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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/teacher/assignments
router.get('/assignments', protect, authorize('teacher'), async (req, res) => {
  try {
    await connectDB();
    const teacher = await Teacher.findOne({ user: req.user.id });
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/teacher/assignments
router.post('/assignments', protect, authorize('teacher'), async (req, res) => {
  try {
    await connectDB();
    const { title, description, class: classId, subject, dueDate, maxMarks, attachments } = req.body;

    const assignment = await Assignment.create({
      title,
      description,
      class: classId,
      subject,
      createdBy: req.user.id,
      dueDate,
      maxMarks: maxMarks || 100,
      attachments: attachments || []
    });

    res.status(201).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Create Assignment Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/teacher/assignments/:id/grade
router.put('/assignments/:id/grade', protect, authorize('teacher'), async (req, res) => {
  try {
    await connectDB();
    const { studentId, marks, feedback } = req.body;

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    if (assignment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to grade this assignment'
      });
    }

    const submission = assignment.submissions.find(
      s => s.student.toString() === studentId
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    submission.marks = marks;
    submission.feedback = feedback;
    submission.status = 'graded';

    await assignment.save();

    res.status(200).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Grade Assignment Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/teacher/attendance
router.post('/attendance', protect, authorize('teacher'), async (req, res) => {
  try {
    await connectDB();
    const { classId, date, records } = req.body;

    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher || !teacher.classes.includes(classId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to mark attendance for this class'
      });
    }

    const attendanceRecords = await Promise.all(
      records.map(async (record) => {
        const attendance = await Attendance.findOneAndUpdate(
          {
            student: record.studentId,
            class: classId,
            date: new Date(date)
          },
          {
            status: record.status,
            markedBy: req.user.id,
            remarks: record.remarks || ''
          },
          { new: true, upsert: true }
        );
        return attendance;
      })
    );

    res.status(200).json({
      success: true,
      data: attendanceRecords
    });
  } catch (error) {
    console.error('Mark Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/teacher/attendance/:classId
router.get('/attendance/:classId', protect, authorize('teacher'), async (req, res) => {
  try {
    await connectDB();
    const { classId } = req.params;
    const { date } = req.query;

    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher || !teacher.classes.includes(classId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view attendance for this class'
      });
    }

    const query = { class: classId };
    if (date) {
      query.date = new Date(date);
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'user rollNumber')
      .populate('student.user', 'firstName lastName')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Get Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/teacher/grades
router.post('/grades', protect, authorize('teacher'), async (req, res) => {
  try {
    await connectDB();
    const { studentId, subjectId, classId, examType, marksObtained, maxMarks, examDate, semester, remarks } = req.body;

    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    const grade = await Grade.create({
      student: studentId,
      subject: subjectId,
      class: classId,
      examType,
      marksObtained,
      maxMarks: maxMarks || 100,
      examDate: examDate || new Date(),
      semester,
      remarks: remarks || '',
      gradedBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: grade
    });
  } catch (error) {
    console.error('Add Grade Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================
// ✅ DASHBOARD ENDPOINTS
// ============================================================

// @route   GET /api/teacher/schedule
router.get('/schedule', protect, authorize('teacher'), async (req, res) => {
  try {
    await connectDB();
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

// @route   GET /api/teacher/activity
router.get('/activity', protect, authorize('teacher'), async (req, res) => {
  try {
    await connectDB();
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

// @route   GET /api/teacher/notices
router.get('/notices', protect, authorize('teacher'), async (req, res) => {
  try {
    await connectDB();
    
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

module.exports = router;