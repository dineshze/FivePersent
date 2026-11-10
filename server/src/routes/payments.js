import { Router } from 'express'
import Loan from '../models/Loan.js'
import Payment from '../models/Payment.js'
import { asyncHandler, validObjectId } from '../utils/http.js'
import { calculateInterest } from '../utils/interest.js'

const router = Router()

router.get('/', asyncHandler(async (request, response) => {
  const payments = await Payment.find({ userId: request.userId })
    .populate({ path: 'loanId', select: 'loanId customerId', populate: { path: 'customerId', select: 'name phone' } })
    .sort({ paymentDate: -1, createdAt: -1 }).limit(2000)
  return response.json(payments)
}))

router.post('/', asyncHandler(async (request, response) => {
  const { loanId, amount, paymentType, paymentDate, notes = '' } = request.body || {}
  if (!validObjectId(loanId)) return response.status(400).json({ message: 'Select a valid loan.' })
  if (!Number.isFinite(amount) || amount <= 0) return response.status(400).json({ message: 'Payment amount must be greater than zero.' })
  if (!['principal', 'interest'].includes(paymentType)) return response.status(400).json({ message: 'Select a valid payment type.' })
  if (typeof paymentDate !== 'string' || Number.isNaN(new Date(paymentDate).getTime())) {
    return response.status(400).json({ message: 'Enter a valid payment date.' })
  }
  if (new Date(paymentDate) > new Date(new Date().toISOString().slice(0, 10))) {
    return response.status(400).json({ message: 'Payment date cannot be in the future.' })
  }
  if (typeof notes !== 'string' || notes.length > 1000) return response.status(400).json({ message: 'Payment notes are too long.' })
  const loan = await Loan.findOne({ _id: loanId, userId: request.userId })
  if (!loan) return response.status(404).json({ message: 'Loan not found in your account.' })
  if (loan.status === 'completed') return response.status(400).json({ message: 'Cannot record payments for a completed loan.' })
  const paymentAt = new Date(paymentDate)
  if (paymentAt < loan.startDate) return response.status(400).json({ message: 'Payment date cannot be before the loan start date.' })
  const priorPayments = await Payment.find({
    userId: request.userId,
    loanId: loan._id,
    paymentDate: { $lte: paymentAt },
  }).lean()
  const balance = calculateInterest(loan, priorPayments, paymentAt)
  const outstanding = paymentType === 'principal' ? balance.outstandingPrincipal : balance.outstandingInterest
  if (amount > outstanding + 0.005) {
    return response.status(400).json({
      message: paymentType === 'principal'
        ? `Payment exceeds the outstanding principal of ₹${outstanding.toFixed(2)}.`
        : `Payment exceeds accrued outstanding interest of ₹${outstanding.toFixed(2)}.`,
    })
  }
  const payment = await Payment.create({
    userId: request.userId,
    loanId: loan._id,
    amount,
    paymentType,
    paymentDate: paymentAt,
    notes: notes.trim(),
  })
  return response.status(201).json(payment)
}))

export default router
