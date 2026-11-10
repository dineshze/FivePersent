import mongoose from 'mongoose'

const propertySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  images: [{ type: String, trim: true, maxlength: 2048 }],
  description: { type: String, trim: true, maxlength: 2000, default: '' },
  estimatedValue: { type: Number, required: true, min: 0 },
  notes: { type: String, trim: true, maxlength: 2000, default: '' },
}, { timestamps: true })

export default mongoose.model('Property', propertySchema)
