import 'dotenv/config'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import Customer from '../src/models/Customer.js'
import Loan from '../src/models/Loan.js'
import Property from '../src/models/Property.js'
import User from '../src/models/User.js'
import { connectDatabase } from '../src/config/db.js'
import { buildHistorySeedFixture } from '../src/utils/historySeed.js'

const seedPassword = 'test1008'

try {
  await connectDatabase()
  const fixture = buildHistorySeedFixture()
  let user = await User.findOne({ email: fixture.account.email })
  if (!user) {
    user = await User.create({
      ...fixture.account,
      password: await bcrypt.hash(seedPassword, 12),
    })
  }

  const customers = await Promise.all(fixture.customers.map((customer) => Customer.findOneAndUpdate(
    { userId: user._id, phone: customer.phone },
    { $set: { ...customer, userId: user._id } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  )))

  for (const record of fixture.loans) {
    const customer = customers[record.customerIndex]
    const property = await Property.findOneAndUpdate(
      { userId: user._id, name: record.property.name },
      { $set: { ...record.property, userId: user._id, customerId: customer._id } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    )
    await Loan.findOneAndUpdate(
      { loanId: record.loan.loanId },
      {
        $set: {
          ...record.loan,
          userId: user._id,
          customerId: customer._id,
          propertyId: property._id,
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    )
  }

  console.info(`Seeded ${fixture.loans.length} historical loans for ${customers.length} customers.`)
  console.info(`Login: ${fixture.account.email} / ${seedPassword}`)
} catch (error) {
  console.error(`Unable to seed historical loans: ${error.message}`)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
