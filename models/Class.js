const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  section: {
    type: String,
    required: true
  },
  grade: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  academicYear: {
    type: String,
    required: true
  },
  classTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  subjects: [{
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher'
    }
  }],
  schedule: {
    monday: [{
      subject: String,
      time: String,
      room: String,
      teacher: String
    }],
    tuesday: [{
      subject: String,
      time: String,
      room: String,
      teacher: String
    }],
    wednesday: [{
      subject: String,
      time: String,
      room: String,
      teacher: String
    }],
    thursday: [{
      subject: String,
      time: String,
      room: String,
      teacher: String
    }],
    friday: [{
      subject: String,
      time: String,
      room: String,
      teacher: String
    }],
    saturday: [{
      subject: String,
      time: String,
      room: String,
      teacher: String
    }]
  },
  roomNumber: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    default: 30
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

ClassSchema.index({ name: 1, section: 1 });
ClassSchema.index({ grade: 1 });

module.exports = mongoose.model('Class', ClassSchema);