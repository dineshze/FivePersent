import 'dotenv/config'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import Customer from '../src/models/Customer.js'
import Loan from '../src/models/Loan.js'
import Payment from '../src/models/Payment.js'
import Property from '../src/models/Property.js'
import User from '../src/models/User.js'
import { connectDatabase } from '../src/config/db.js'
import { buildTestFixtures, TEST_SEED_PASSWORD } from '../src/utils/testSeed.js'

if (process.env.NODE_ENV === 'production') {
  throw new Error('Test data seeding is disabled when NODE_ENV=production.')
}

if (process.env.ALLOW_TEST_SEED !== 'true') {
  throw new Error('Set ALLOW_TEST_SEED=true to confirm you want to add sample users and test data.')
}

const fixtures = buildTestFixtures()

try {
  await connectDatabase()
  const hashedPassword = await bcrypt.hash(TEST_SEED_PASSWORD, 12)
  let totalLoans = 0
  let totalPayments = 0

  for (const userFixture of fixtures.users) {
    const { profile, userIndex, loans } = userFixture
    let user = await User.findOne({ email: profile.email })
    if (!user) {
      user = await User.create({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        password: hashedPassword,
        createdAt: userFixture.createdAt,
      })
    }

    for (const fixture of loans) {
      const customer = await Customer.findOneAndUpdate(
        { userId: user._id, phone: fixture.customer.phone },
        { $set: fixture.customer },
        { upsert: true, new: true, runValidators: true, timestamps: false },
      )
      const property = await Property.findOneAndUpdate(
        { userId: user._id, customerId: customer._id, name: fixture.property.name },
        { $set: { ...fixture.property, userId: user._id, customerId: customer._id } },
        { upsert: true, new: true, runValidators: true, timestamps: false },
      )
      const loan = await Loan.findOneAndUpdate(
        { loanId: fixture.loanId },
        {
          $set: {
            ...fixture.loan,
            userId: user._id,
            customerId: customer._id,
            propertyId: property._id,
          },
        },
        { upsert: true, new: true, runValidators: true, timestamps: false },
      )

      for (const payment of fixture.payments) {
        await Payment.findOneAndUpdate(
          {
            userId: user._id,
            loanId: loan._id,
            paymentType: payment.paymentType,
            notes: payment.notes,
          },
          { $set: { ...payment, userId: user._id, loanId: loan._id } },
          { upsert: true, new: true, runValidators: true, timestamps: false },
        )
        totalPayments += 1
      }
      totalLoans += 1
    }

    const loanPrefix = `FP-TEST-${userIndex + 1}-`
    const [customerCount, propertyCount, loanCount] = await Promise.all([
      Customer.countDocuments({ userId: user._id, phone: new RegExp(`^\\+9199${String(userIndex + 1).padStart(2, '0')}`) }),
      Property.countDocuments({ userId: user._id, notes: { $regex: `^Seeded test record for ${loanPrefix}` } }),
      Loan.countDocuments({ userId: user._id, loanId: { $regex: `^${loanPrefix}` } }),
    ])
    if (customerCount !== loans.length || propertyCount !== loans.length || loanCount !== loans.length) {
      throw new Error(`Seed verification failed for ${profile.email}: expected ${loans.length} customers, properties, and loans.`)
    }

    console.info(`Verified ${customerCount} customers, ${propertyCount} properties, and ${loanCount} loans for ${profile.name}.`)
  }

  console.info(`Test seed complete: ${fixtures.users.length} users, ${totalLoans} loans, ${totalPayments} payments.`)
  console.info(`Test account password (new accounts only): ${TEST_SEED_PASSWORD}`)
} catch (error) {
  console.error(`Test data seeding failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
