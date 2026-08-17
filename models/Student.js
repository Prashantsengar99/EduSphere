const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true  // 🔥 Index for faster queries
  },
  rollNumber: {
    type: String,
    required: true,
    unique: true
  },
  admissionDate: {
    type: Date,
    default: Date.now
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
    index: true  // 🔥 Index for faster queries
  },
  section: {
    type: String,
    trim: true,
    default: 'A'
  },
  parentName: {
    type: String,
    default: 'Not Provided'
  },
  parentPhone: {
    type: String,
    default: 'Not Provided'
  },
  parentEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  parentOccupation: String,
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  medicalInfo: {
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    allergies: [String],
    medications: [String],
    conditions: [String]
  },
  previousSchool: String,
  transferCertificate: String,
  achievements: [{
    title: String,
    date: Date,
    description: String
  }],
  attendance: {
    type: Number,
    default: 0
  },
  grades: {
    type: Map,
    of: Number
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// 🔥 Virtual for full name
StudentSchema.virtual('fullName').get(function() {
  return this.user?.firstName + ' ' + this.user?.lastName || 'Unknown';
});

// 🔥 Indexes
StudentSchema.index({ rollNumber: 1 });
StudentSchema.index({ class: 1, section: 1 });

module.exports = mongoose.model('Student', StudentSchema);