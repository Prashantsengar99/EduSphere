const mongoose = require('mongoose');

const GradeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  examType: {
    type: String,
    enum: ['unit-test', 'mid-term', 'final', 'practical', 'assignment', 'project'],
    required: true
  },
  marksObtained: {
    type: Number,
    required: true,
    min: 0
  },
  maxMarks: {
    type: Number,
    required: true,
    default: 100
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']
  },
  remarks: String,
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  examDate: {
    type: Date,
    required: true
  },
  semester: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate percentage and grade
GradeSchema.pre('save', function(next) {
  if (this.marksObtained && this.maxMarks) {
    this.percentage = (this.marksObtained / this.maxMarks) * 100;
    
    const p = this.percentage;
    if (p >= 90) this.grade = 'A+';
    else if (p >= 80) this.grade = 'A';
    else if (p >= 70) this.grade = 'B+';
    else if (p >= 60) this.grade = 'B';
    else if (p >= 50) this.grade = 'C+';
    else if (p >= 40) this.grade = 'C';
    else if (p >= 33) this.grade = 'D';
    else this.grade = 'F';
  }
  next();
});

GradeSchema.index({ student: 1, subject: 1 });
GradeSchema.index({ class: 1, examType: 1 });

module.exports = mongoose.model('Grade', GradeSchema);