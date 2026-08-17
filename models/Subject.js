const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  category: {
    type: String,
    enum: ['core', 'elective', 'vocational']
  },
  credits: {
    type: Number,
    default: 1
  },
  maxMarks: {
    type: Number,
    default: 100
  },
  passingMarks: {
    type: Number,
    default: 33
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Subject', SubjectSchema);