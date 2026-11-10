import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateInterest, getLoanStatus } from '../src/utils/interest.js'

const loan = {
  principalAmount: 10000,
  interestRate: 5,
  interestType: 'monthly',
  startDate: '2026-01-01T00:00:00.000Z',
  dueDate: '2026-04-01T00:00:00.000Z',
  status: 'active',
}

test('monthly interest accrues only for completed monthly periods', () => {
  assert.equal(calculateInterest(loan, [], new Date('2026-04-01T00:00:00.000Z')).accumulatedInterest, 1500)
  assert.equal(calculateInterest(loan, [], new Date('2026-01-31T00:00:00.000Z')).accumulatedInterest, 0)
  assert.equal(calculateInterest({ ...loan, startDate: '2026-01-31T00:00:00.000Z' }, [], new Date('2026-02-28T00:00:00.000Z')).accumulatedInterest, 500)
})

test('annual interest uses elapsed days divided by 365', () => {
  const annualLoan = { ...loan, interestRate: 10, interestType: 'annually' }
  const result = calculateInterest(annualLoan, [], new Date('2026-02-01T00:00:00.000Z'))
  assert.equal(result.elapsedDays, 31)
  assert.equal(result.accumulatedInterest, 84.93)
})

test('principal and interest payments reduce their respective outstanding balances', () => {
  const result = calculateInterest(loan, [
    { amount: 2500, paymentType: 'principal', paymentDate: '2026-02-15T00:00:00.000Z' },
    { amount: 300, paymentType: 'interest', paymentDate: '2026-03-01T00:00:00.000Z' },
  ], new Date('2026-04-01T00:00:00.000Z'))
  assert.equal(result.accumulatedInterest, 1375)
  assert.equal(result.outstandingPrincipal, 7500)
  assert.equal(result.outstandingInterest, 1075)
  assert.equal(result.totalOutstanding, 8575)
})

test('annual interest accrues on the reduced principal after a principal payment', () => {
  const result = calculateInterest(
    { ...loan, interestRate: 10, interestType: 'annually' },
    [{ amount: 5000, paymentType: 'principal', paymentDate: '2026-01-16T00:00:00.000Z' }],
    new Date('2026-02-01T00:00:00.000Z'),
  )
  assert.equal(result.accumulatedInterest, 63.01)
  assert.equal(result.outstandingPrincipal, 5000)
})

test('loan status becomes overdue after the due date, but not on the due date', () => {
  assert.equal(getLoanStatus(loan, new Date('2026-04-01T12:00:00.000Z')), 'active')
  assert.equal(getLoanStatus(loan, new Date('2026-04-02T00:00:00.000Z')), 'overdue')
  assert.equal(getLoanStatus({ ...loan, status: 'completed' }, new Date('2026-04-02T00:00:00.000Z')), 'completed')
})
