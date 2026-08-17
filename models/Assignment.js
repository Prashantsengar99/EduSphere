const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  maxMarks: {
    type: Number,
    required: true,
    default: 100
  },
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  submissions: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    fileUrl: String,
    remarks: String,
    marks: Number,
    feedback: String,
    status: {
      type: String,
      enum: ['pending', 'submitted', 'graded'],
      default: 'pending'
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

AssignmentSchema.index({ class: 1, dueDate: 1 });

module.exports = mongoose.model('Assignment', AssignmentSchema);