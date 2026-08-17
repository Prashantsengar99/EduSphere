const mongoose = require('mongoose');

const FeeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  feeType: {
    type: String,
    enum: ['tuition', 'development', 'library', 'sports', 'lab', 'annual', 'transport', 'other'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'partially-paid', 'paid', 'overdue'],
    default: 'pending'
  },
  payments: [{
    amount: Number,
    date: {
      type: Date,
      default: Date.now
    },
    method: {
      type: String,
      enum: ['cash', 'card', 'upi', 'bank-transfer', 'online']
    },
    transactionId: String,
    receiptId: String,
    notes: String
  }],
  lateFee: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  scholarship: {
    type: Number,
    default: 0
  },
  academicYear: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Update status based on payments
FeeSchema.pre('save', function(next) {
  if (this.paidAmount >= this.amount) {
    this.status = 'paid';
  } else if (this.paidAmount > 0) {
    this.status = 'partially-paid';
  } else if (new Date() > this.dueDate && this.paidAmount === 0) {
    this.status = 'overdue';
  } else {
    this.status = 'pending';
  }
  next();
});

FeeSchema.index({ student: 1, status: 1 });

module.exports = mongoose.model('Fee', FeeSchema);