const mongoose = require('mongoose');

const TeacherSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  department: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    required: true
  },
  qualification: {
    type: String,
    required: true
  },
  experience: {
    type: Number,
    default: 0
  },
  specialization: [String],
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  classes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  joiningDate: {
    type: Date,
    default: Date.now
  },
  salary: {
    type: Number,
    default: 0
  },
  bankDetails: {
    accountNumber: String,
    bankName: String,
    ifscCode: String
  },
  certifications: [{
    name: String,
    issuedBy: String,
    date: Date,
    expiry: Date
  }],
  schedule: {
    type: Map,
    of: [{
      subject: String,
      class: String,
      time: String,
      room: String
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

TeacherSchema.virtual('name').get(function() {
  return this.user?.fullName || 'Unknown';
});

TeacherSchema.index({ employeeId: 1 });
TeacherSchema.index({ department: 1 });

module.exports = mongoose.model('Teacher', TeacherSchema);