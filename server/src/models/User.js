import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
  phone: { type: String, required: true, trim: true, maxlength: 20 },
  password: { type: String, required: true, select: false },
}, { timestamps: { createdAt: true, updatedAt: false } })

userSchema.index({ email: 1 }, { unique: true })

export default mongoose.model('User', userSchema)
