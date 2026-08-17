const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Grade = require('../models/Grade');
const Attendance = require('../models/Attendance');
const { protect, authorize } = require('../middleware/auth');
const connectDB = require('../config/db');

// ============================================================
// 🔥 FIXED: GET ALL STUDENTS (ONLY TEACHER'S CLASSES)
// ============================================================
router.get('/', protect, authorize('teacher'), async (req, res) => {
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

    console.log(`📚 Teacher ${teacher._id} has ${students.length} students`);

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
// GET SINGLE STUDENT
// ============================================================
router.get('/:id', protect, authorize('teacher'), async (req, res) => {
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
router.post('/', protect, authorize('teacher'), async (req, res) => {
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
      classId,      // 🔥 "2" ya ObjectId
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
      // Try by ObjectId first
      try {
        const mongoose = require('mongoose');
        if (mongoose.Types.ObjectId.isValid(classId)) {
          classDoc = await Class.findById(classId);
        }
      } catch (err) {
        // Invalid ObjectId, ignore
      }

      // 🔥 Agar nahi mila toh number/name se try karo
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

    // 5️⃣ Create Student Profile
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

    res.status(201).json({
      success: true,
      message: `✅ Student ${firstName} ${lastName} created successfully!`,
      data: student
    });

  } catch (error) {
    console.error('❌ Create Student Error:', error);
    console.error('❌ Error Stack:', error.stack);
    
    // 🔥 Cleanup: Delete user if student creation fails
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
// ✅ FIXED: UPDATE STUDENT (with Class update support)
// ============================================================
router.put('/:id', protect, authorize('teacher'), async (req, res) => {
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
      classId   // 🔥 Class update bhi ho sakta hai
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
      
      // Try by ObjectId
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
// ✅ FIXED: DELETE STUDENT (with class cleanup)
// ============================================================
router.delete('/:id', protect, authorize('teacher'), async (req, res) => {
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

    // 🔥 Remove from class
    await Class.findByIdAndUpdate(student.class, {
      $pull: { students: student._id }
    });

    // Delete Student
    const studentData = student.toObject();
    await student.deleteOne();
    
    // Delete User
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
// ADD GRADE
// ============================================================
router.post('/:id/grades', protect, authorize('teacher'), async (req, res) => {
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

    const { subjectId, marksObtained, maxMarks, examType, examDate, semester, remarks } = req.body;

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
// GET GRADES
// ============================================================
router.get('/:id/grades', protect, authorize('teacher'), async (req, res) => {
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

    const grades = await Grade.find({ student: student._id })
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

module.exports = router;