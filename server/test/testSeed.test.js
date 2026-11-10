import test from 'node:test'
import assert from 'node:assert/strict'
import { buildTestFixtures } from '../src/utils/testSeed.js'

test('builds five isolated test accounts with at least twenty loans each', () => {
  const fixtures = buildTestFixtures(new Date('2026-11-10T12:00:00.000Z'))
  assert.equal(fixtures.users.length, 5)
  assert.equal(fixtures.users.reduce((total, user) => total + user.loans.length, 0), 125)
  assert.equal(new Set(fixtures.users.map((user) => user.profile.email)).size, 5)
  for (const user of fixtures.users) {
    assert.equal(user.loans.length, 25)
    assert.equal(new Set(user.loans.map((fixture) => fixture.loanId)).size, 25)
    assert.ok(user.loans.every((fixture) => fixture.customer.phone.startsWith('+91')))
  }
})

test('generates loans and payments within the previous year', () => {
  const referenceDate = new Date('2026-11-10T12:00:00.000Z')
  const fixtures = buildTestFixtures(referenceDate)
  const earliestAllowed = new Date('2025-11-11T00:00:00.000Z')
  for (const user of fixtures.users) {
    for (const fixture of user.loans) {
      assert.ok(fixture.loan.startDate >= earliestAllowed)
      assert.ok(fixture.loan.startDate <= referenceDate)
      assert.ok(fixture.loan.dueDate >= fixture.loan.startDate)
      assert.ok(fixture.payments.every((payment) => (
        payment.paymentDate >= fixture.loan.startDate && payment.paymentDate <= referenceDate
      )))
    }
  }
})

test('uses deterministic, non-production test email addresses', () => {
  const first = buildTestFixtures(new Date('2026-11-10T12:00:00.000Z'))
  const second = buildTestFixtures(new Date('2026-11-10T12:00:00.000Z'))
  assert.deepEqual(
    first.users.map((user) => user.profile.email),
    second.users.map((user) => user.profile.email),
  )
  assert.ok(first.users.every((user) => user.profile.email.endsWith('.test')))
})
