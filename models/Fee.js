const mongoose = require('mongoose');

const FeeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  pendingAmount: {
    type: Number,
    default: 0
  },
  dueDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['paid', 'pending', 'overdue'],
    default: 'pending'
  },
  payments: [{
    amount: Number,
    method: {
      type: String,
      enum: ['card', 'upi', 'netbanking', 'cash']
    },
    transactionId: String,
    paidAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'pending'],
      default: 'success'
    }
  }]
}, {
  timestamps: true
});

// Calculate pending amount before saving
FeeSchema.pre('save', function(next) {
  this.pendingAmount = this.totalAmount - this.paidAmount;
  if (this.pendingAmount === 0) {
    this.status = 'paid';
  } else if (this.dueDate && new Date() > this.dueDate) {
    this.status = 'overdue';
  }
  next();
});

module.exports = mongoose.model('Fee', FeeSchema);