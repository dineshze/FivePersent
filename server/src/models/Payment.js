import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true, index: true },
  amount: { type: Number, required: true, min: 0.01 },
  paymentType: { type: String, required: true, enum: ['principal', 'interest'] },
  paymentDate: { type: Date, required: true },
  notes: { type: String, trim: true, maxlength: 1000, default: '' },
}, { timestamps: { createdAt: true, updatedAt: false } })

paymentSchema.index({ userId: 1, paymentDate: -1 })

export default mongoose.model('Payment', paymentSchema)
