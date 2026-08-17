const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Student = require('../models/Student');
const User = require('../models/User');
const Class = require('../models/Class');
const Grade = require('../models/Grade');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const Fee = require('../models/Fee');
const connectDB = require('../config/db');

// @route   GET /api/student/profile
// @desc    Get student profile
// @access  Private (Student only)
router.get('/profile', protect, authorize('student'), async (req, res) => {
  try {
    await connectDB();
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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/student/grades
// @desc    Get student grades
// @access  Private (Student only)
router.get('/grades', protect, authorize('student'), async (req, res) => {
  try {
    await connectDB();
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

    // Calculate statistics
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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/student/attendance
// @desc    Get student attendance
// @access  Private (Student only)
router.get('/attendance', protect, authorize('student'), async (req, res) => {
  try {
    await connectDB();
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

    // Calculate statistics
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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/student/assignments
// @desc    Get student assignments
// @access  Private (Student only)
router.get('/assignments', protect, authorize('student'), async (req, res) => {
  try {
    await connectDB();
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

    // Mark if submitted
    const assignmentsWithStatus = assignments.map(assignment => {
      const submission = assignment.submissions.find(
        s => s.student.toString() === student._id.toString()
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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/student/assignments/:id/submit
// @desc    Submit assignment
// @access  Private (Student only)
router.post('/assignments/:id/submit', protect, authorize('student'), async (req, res) => {
  try {
    await connectDB();
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

    // Check if student belongs to this class
    if (assignment.class.toString() !== student.class.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this class'
      });
    }

    // Check if already submitted
    const existingSubmission = assignment.submissions.find(
      s => s.student.toString() === student._id.toString()
    );

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted this assignment'
      });
    }

    // Add submission
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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/student/fees
// @desc    Get student fees
// @access  Private (Student only)
router.get('/fees', protect, authorize('student'), async (req, res) => {
  try {
    await connectDB();
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
          feesPaid: fees.filter(f => f.status === 'paid').length,
          feesPending: fees.filter(f => f.status === 'pending' || f.status === 'overdue').length
        }
      }
    });
  } catch (error) {
    console.error('Get Student Fees Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;