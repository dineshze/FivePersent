import mongoose from 'mongoose'

const loanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  loanId: { type: String, required: true, unique: true, index: true },
  principalAmount: { type: Number, required: true, min: 1 },
  interestRate: { type: Number, required: true, min: 0, max: 100 },
  interestType: { type: String, required: true, enum: ['monthly', 'annually'] },
  startDate: { type: Date, required: true },
  duration: { type: String, trim: true, maxlength: 80, default: '' },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  notes: { type: String, trim: true, maxlength: 2000, default: '' },
}, { timestamps: { createdAt: true, updatedAt: true } })

loanSchema.index({ userId: 1, createdAt: -1 })
loanSchema.index({ userId: 1, dueDate: 1, status: 1 })

export default mongoose.model('Loan', loanSchema)
