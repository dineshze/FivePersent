import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { asyncHandler, validEmail, validPhone } from '../utils/http.js'

const router = Router()
const tokenFor = (userId) => jwt.sign({}, process.env.JWT_SECRET, { subject: String(userId), expiresIn: '7d' })
const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, phone: user.phone })

router.post('/register', asyncHandler(async (request, response) => {
  const { name, email, phone, password } = request.body || {}
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    return response.status(400).json({ message: 'Enter a name between 2 and 100 characters.' })
  }
  if (!validEmail(email)) return response.status(400).json({ message: 'Enter a valid email address.' })
  if (!validPhone(phone)) return response.status(400).json({ message: 'Enter a valid phone number.' })
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
    return response.status(400).json({ message: 'Password must be between 8 and 72 characters.' })
  }
  const normalizedEmail = email.trim().toLowerCase()
  if (await User.exists({ email: normalizedEmail })) {
    return response.status(409).json({ message: 'An account with this email already exists.' })
  }
  const hashedPassword = await bcrypt.hash(password, 12)
  const user = await User.create({ name: name.trim(), email: normalizedEmail, phone: phone.trim(), password: hashedPassword })
  return response.status(201).json({ token: tokenFor(user._id), user: publicUser(user) })
}))

router.post('/login', asyncHandler(async (request, response) => {
  const { email, password } = request.body || {}
  if (!validEmail(email) || typeof password !== 'string' || password.length > 72) {
    return response.status(400).json({ message: 'Enter your email and password.' })
  }
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password')
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return response.status(401).json({ message: 'Email or password is incorrect.' })
  }
  return response.json({ token: tokenFor(user._id), user: publicUser(user) })
}))

router.get('/me', asyncHandler(async (request, response) => {
  const user = await User.findById(request.userId).select('name email phone')
  if (!user) return response.status(404).json({ message: 'Account not found.' })
  return response.json(publicUser(user))
}))

export default router
