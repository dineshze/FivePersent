import mongoose from 'mongoose'

const customerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  photo: { type: String, trim: true, maxlength: 2048, default: '' },
  phone: { type: String, required: true, trim: true, maxlength: 20 },
  email: { type: String, trim: true, lowercase: true, maxlength: 254, default: '' },
  address: { type: String, required: true, trim: true, maxlength: 1000 },
}, { timestamps: { createdAt: true, updatedAt: true } })

customerSchema.index({ userId: 1, phone: 1 }, { unique: true })

export default mongoose.model('Customer', customerSchema)
