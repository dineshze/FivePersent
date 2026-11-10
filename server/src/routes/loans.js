import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import Customer from '../models/Customer.js'
import Loan from '../models/Loan.js'
import Payment from '../models/Payment.js'
import Property from '../models/Property.js'
import { asyncHandler, validEmail, validObjectId, validPhone } from '../utils/http.js'
import { serializeLoan } from '../utils/interest.js'

const router = Router()

function validDate(value) {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime())
}

function validImageUrls(images) {
  return Array.isArray(images) && images.length <= 8 && images.every((image) => {
    try { return ['http:', 'https:'].includes(new URL(image).protocol) } catch { return false }
  })
}

async function paymentsFor(userId, loanIds) {
  if (!loanIds.length) return new Map()
  const payments = await Payment.find({ userId, loanId: { $in: loanIds } }).lean()
  return payments.reduce((map, payment) => {
    const key = String(payment.loanId)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(payment)
    return map
  }, new Map())
}

router.get('/', asyncHandler(async (request, response) => {
  const loans = await Loan.find({ userId: request.userId })
    .populate('customerId', 'name phone email photo address')
    .populate('propertyId', 'name description estimatedValue images notes')
    .sort({ createdAt: -1 }).limit(1000)
  const paymentMap = await paymentsFor(request.userId, loans.map((loan) => loan._id))
  return response.json(loans.map((loan) => serializeLoan(loan, paymentMap.get(String(loan._id)) || [])))
}))

router.post('/', asyncHandler(async (request, response) => {
  const { customer: customerInput, property: propertyInput, loan: loanInput } = request.body || {}
  if (!customerInput || !propertyInput || !loanInput) {
    return response.status(400).json({ message: 'Customer, property and loan details are required.' })
  }
  if (typeof customerInput.name !== 'string' || customerInput.name.trim().length < 2 || customerInput.name.trim().length > 120) {
    return response.status(400).json({ message: 'Enter a valid customer name.' })
  }
  if (!validPhone(customerInput.phone)) return response.status(400).json({ message: 'Enter a valid customer phone number.' })
  if (customerInput.email && !validEmail(customerInput.email)) return response.status(400).json({ message: 'Enter a valid customer email address.' })
  if (typeof customerInput.address !== 'string' || !customerInput.address.trim() || customerInput.address.length > 1000) {
    return response.status(400).json({ message: 'Enter a valid customer address.' })
  }
  if (typeof propertyInput.name !== 'string' || !propertyInput.name.trim() || propertyInput.name.length > 160) {
    return response.status(400).json({ message: 'Enter a valid property name.' })
  }
  if (propertyInput.description !== undefined && (typeof propertyInput.description !== 'string' || propertyInput.description.length > 2000)) {
    return response.status(400).json({ message: 'Property description is too long.' })
  }
  if (propertyInput.notes !== undefined && (typeof propertyInput.notes !== 'string' || propertyInput.notes.length > 2000)) {
    return response.status(400).json({ message: 'Property notes are too long.' })
  }
  if (!Number.isFinite(propertyInput.estimatedValue) || propertyInput.estimatedValue < 0) {
    return response.status(400).json({ message: 'Enter a valid estimated property value.' })
  }
  if (!validImageUrls(propertyInput.images || [])) return response.status(400).json({ message: 'Property images must be valid HTTP or HTTPS URLs (up to 8 images).' })
  if (customerInput.photo && !validImageUrls([customerInput.photo])) return response.status(400).json({ message: 'Customer photo must be a valid HTTP or HTTPS URL.' })
  const { principalAmount, interestRate, interestType, startDate, duration = '', dueDate, notes = '' } = loanInput
  if (!Number.isFinite(principalAmount) || principalAmount <= 0) return response.status(400).json({ message: 'Loan amount must be greater than zero.' })
  if (!Number.isFinite(interestRate) || interestRate < 0 || interestRate > 100) return response.status(400).json({ message: 'Interest rate must be between 0 and 100.' })
  if (!['monthly', 'annually'].includes(interestType)) return response.status(400).json({ message: 'Select a valid interest type.' })
  if (!validDate(startDate) || !validDate(dueDate) || new Date(dueDate) < new Date(startDate)) {
    return response.status(400).json({ message: 'Enter valid loan dates. The due date cannot be before the start date.' })
  }
  if (typeof duration !== 'string' || duration.length > 80 || typeof notes !== 'string' || notes.length > 2000) {
    return response.status(400).json({ message: 'Loan duration or notes are too long.' })
  }

  let customer
  let createdCustomer = false
  let property
  try {
    if (customerInput.id) {
      if (!validObjectId(customerInput.id)) return response.status(400).json({ message: 'Invalid customer ID.' })
      customer = await Customer.findOne({ _id: customerInput.id, userId: request.userId })
      if (!customer) return response.status(404).json({ message: 'Customer not found in your account.' })
    } else {
      customer = await Customer.findOne({ userId: request.userId, phone: customerInput.phone.trim() })
      if (!customer) {
        customer = await Customer.create({
          userId: request.userId,
          name: customerInput.name.trim(),
          phone: customerInput.phone.trim(),
          email: (customerInput.email || '').trim().toLowerCase(),
          address: customerInput.address.trim(),
          photo: customerInput.photo || '',
        })
        createdCustomer = true
      }
    }
    property = await Property.create({
      userId: request.userId,
      customerId: customer._id,
      name: propertyInput.name.trim(),
      images: propertyInput.images || [],
      description: (propertyInput.description || '').trim(),
      estimatedValue: propertyInput.estimatedValue,
      notes: (propertyInput.notes || '').trim(),
    })
    const generatedId = `FP-${new Date().getFullYear()}-${randomUUID().slice(0, 12).toUpperCase()}`
    const loan = await Loan.create({
      userId: request.userId,
      customerId: customer._id,
      propertyId: property._id,
      loanId: generatedId,
      principalAmount,
      interestRate,
      interestType,
      startDate: new Date(startDate),
      duration: duration.trim(),
      dueDate: new Date(dueDate),
      notes: notes.trim(),
    })
    await loan.populate([
      { path: 'customerId', select: 'name phone email photo address' },
      { path: 'propertyId', select: 'name description estimatedValue images notes' },
    ])
    return response.status(201).json(serializeLoan(loan, []))
  } catch (error) {
    if (property) await Property.deleteOne({ _id: property._id, userId: request.userId })
    if (createdCustomer && customer) await Customer.deleteOne({ _id: customer._id, userId: request.userId })
    throw error
  }
}))

router.patch('/:id', asyncHandler(async (request, response) => {
  if (!validObjectId(request.params.id)) return response.status(400).json({ message: 'Invalid loan ID.' })
  const existingLoan = await Loan.findOne({ _id: request.params.id, userId: request.userId }).select('startDate principalAmount')
  if (!existingLoan) return response.status(404).json({ message: 'Loan not found.' })
  const { principalAmount, interestRate, interestType, dueDate, duration, status, notes } = request.body || {}
  const changes = {}
  if (principalAmount !== undefined) {
    if (!Number.isFinite(principalAmount) || principalAmount <= 0) {
      return response.status(400).json({ message: 'Loan amount must be greater than zero.' })
    }
    const principalPayments = await Payment.find({
      userId: request.userId,
      loanId: existingLoan._id,
      paymentType: 'principal',
    }).select('amount').lean()
    const principalPaid = principalPayments.reduce((sum, payment) => sum + payment.amount, 0)
    if (principalAmount < principalPaid) {
      return response.status(400).json({ message: 'Loan amount cannot be less than principal already repaid.' })
    }
    changes.principalAmount = principalAmount
  }
  if (interestRate !== undefined) {
    if (!Number.isFinite(interestRate) || interestRate < 0 || interestRate > 100) {
      return response.status(400).json({ message: 'Interest rate must be between 0 and 100.' })
    }
    changes.interestRate = interestRate
  }
  if (interestType !== undefined) {
    if (!['monthly', 'annually'].includes(interestType)) return response.status(400).json({ message: 'Select a valid interest type.' })
    changes.interestType = interestType
  }
  if (dueDate !== undefined) {
    if (!validDate(dueDate) || new Date(dueDate) < existingLoan.startDate) {
      return response.status(400).json({ message: 'Enter a valid due date on or after the loan start date.' })
    }
    changes.dueDate = new Date(dueDate)
  }
  if (duration !== undefined) {
    if (typeof duration !== 'string' || duration.length > 80) return response.status(400).json({ message: 'Duration is too long.' })
    changes.duration = duration.trim()
  }
  if (notes !== undefined) {
    if (typeof notes !== 'string' || notes.length > 2000) return response.status(400).json({ message: 'Notes are too long.' })
    changes.notes = notes.trim()
  }
  if (status !== undefined) {
    if (!['active', 'completed'].includes(status)) return response.status(400).json({ message: 'Select a valid loan status.' })
    changes.status = status
  }
  const loan = await Loan.findOneAndUpdate(
    { _id: request.params.id, userId: request.userId },
    { $set: changes },
    { new: true, runValidators: true },
  ).populate('customerId', 'name phone email photo address').populate('propertyId', 'name description estimatedValue images notes')
  if (!loan) return response.status(404).json({ message: 'Loan not found.' })
  const payments = await Payment.find({ userId: request.userId, loanId: loan._id }).lean()
  return response.json(serializeLoan(loan, payments))
}))

router.delete('/:id', asyncHandler(async (request, response) => {
  if (!validObjectId(request.params.id)) return response.status(400).json({ message: 'Invalid loan ID.' })
  const loan = await Loan.findOneAndDelete({ _id: request.params.id, userId: request.userId })
  if (!loan) return response.status(404).json({ message: 'Loan not found.' })
  await Promise.all([
    Payment.deleteMany({ userId: request.userId, loanId: loan._id }),
    Property.deleteOne({ userId: request.userId, _id: loan.propertyId }),
  ])
  return response.json({ message: 'Loan and its payment history were deleted.' })
}))

router.get('/:id', asyncHandler(async (request, response) => {
  if (!validObjectId(request.params.id)) return response.status(400).json({ message: 'Invalid loan ID.' })
  const loan = await Loan.findOne({ _id: request.params.id, userId: request.userId })
    .populate('customerId', 'name phone email photo address')
    .populate('propertyId', 'name description estimatedValue images notes')
  if (!loan) return response.status(404).json({ message: 'Loan not found.' })
  const payments = await Payment.find({ userId: request.userId, loanId: loan._id }).lean()
  return response.json(serializeLoan(loan, payments))
}))

export default router
