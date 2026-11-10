const TEST_PASSWORD = 'FivePercentTest!2026'

const userProfiles = [
  { name: 'Aarav Mehta', email: 'seed.user1@example.test', phone: '+919800000001', city: 'Mumbai' },
  { name: 'Diya Nair', email: 'seed.user2@example.test', phone: '+919800000002', city: 'Kochi' },
  { name: 'Kabir Shah', email: 'seed.user3@example.test', phone: '+919800000003', city: 'Ahmedabad' },
  { name: 'Mira Iyer', email: 'seed.user4@example.test', phone: '+919800000004', city: 'Chennai' },
  { name: 'Rohan Das', email: 'seed.user5@example.test', phone: '+919800000005', city: 'Kolkata' },
]

const firstNames = [
  'Aditi', 'Arjun', 'Ananya', 'Dev', 'Isha', 'Karan', 'Kavya', 'Nikhil', 'Neha', 'Rahul',
  'Riya', 'Sahil', 'Sara', 'Tara', 'Vikram', 'Yash', 'Zoya', 'Aman', 'Leela', 'Varun',
  'Maya', 'Ishaan', 'Pooja', 'Rehan', 'Sana',
]
const lastNames = [
  'Sharma', 'Patel', 'Reddy', 'Khan', 'Kapoor', 'Joshi', 'Rao', 'Singh', 'Pillai', 'Gupta',
]
const propertyNames = ['Gold jewellery', 'Residential plot', 'Shop unit', 'Farm equipment', 'Vehicle documents']
const durations = [3, 6, 9, 12]
const monthlyRates = [2, 3, 4, 5]
const annualRates = [12, 15, 18]
const DAY_MS = 24 * 60 * 60 * 1000

function utcDay(date) {
  const day = new Date(date)
  day.setUTCHours(0, 0, 0, 0)
  return day
}

function addDays(date, days) {
  return new Date(date.getTime() + days * DAY_MS)
}

function addMonths(date, months) {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + months
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), lastDay)))
}

function roundMoney(amount) {
  return Math.round((amount + Number.EPSILON) * 100) / 100
}

export const TEST_SEED_PASSWORD = TEST_PASSWORD

export function buildTestFixtures(referenceDate = new Date()) {
  const today = utcDay(referenceDate)
  const users = userProfiles.map((profile, userIndex) => {
    const loans = Array.from({ length: 25 }, (_, loanIndex) => {
      const daysAgo = Math.round(((24 - loanIndex) / 24) * 364)
      const startDate = addDays(today, -daysAgo)
      const termMonths = durations[(loanIndex + userIndex) % durations.length]
      const dueDate = addMonths(startDate, termMonths)
      const isMonthly = (loanIndex + userIndex) % 4 !== 0
      const interestType = isMonthly ? 'monthly' : 'annually'
      const interestRate = isMonthly
        ? monthlyRates[(loanIndex + userIndex) % monthlyRates.length]
        : annualRates[(loanIndex + userIndex) % annualRates.length]
      const principalAmount = 10000 + ((loanIndex * 3791 + userIndex * 5273) % 90000)
      const loanId = `FP-TEST-${userIndex + 1}-${String(loanIndex + 1).padStart(3, '0')}`
      const customerIndex = loanIndex
      const firstName = firstNames[(loanIndex + userIndex * 3) % firstNames.length]
      const lastName = lastNames[(loanIndex * 3 + userIndex) % lastNames.length]
      const customer = {
        name: `${firstName} ${lastName}`,
        phone: `+9199${String(userIndex + 1).padStart(2, '0')}${String(loanIndex + 1).padStart(5, '0')}`,
        email: `customer.${loanIndex + 1}.user${userIndex + 1}@example.test`,
        address: `${20 + loanIndex} Sample Market Road, ${profile.city}`,
        photo: '',
        createdAt: startDate,
        updatedAt: startDate,
      }
      const property = {
        name: `${propertyNames[(loanIndex + userIndex) % propertyNames.length]} ${String(loanIndex + 1).padStart(2, '0')}`,
        images: [],
        description: `Sample pledged property for ${customer.name}.`,
        estimatedValue: roundMoney(principalAmount * (1.5 + ((loanIndex + userIndex) % 4) * 0.25)),
        notes: `Seeded test record for ${loanId}.`,
        createdAt: startDate,
        updatedAt: startDate,
      }
      const completed = dueDate < today && loanIndex % 5 === 0
      const loan = {
        loanId,
        principalAmount,
        interestRate,
        interestType,
        startDate,
        duration: `${termMonths} months`,
        dueDate,
        status: completed ? 'completed' : 'active',
        notes: `Sample loan ${loanIndex + 1} of 25 for testing.`,
        createdAt: startDate,
        updatedAt: startDate,
      }
      const payments = []
      if (daysAgo >= 90 && (loanIndex + userIndex) % 3 === 0) {
        const paymentDate = addDays(startDate, 45)
        const principalPayment = roundMoney(principalAmount * 0.05)
        const interestPayment = interestType === 'monthly'
          ? roundMoney(principalAmount * (interestRate / 100) * 0.5)
          : roundMoney(principalAmount * (interestRate / 100) * 45 / 365 * 0.5)
        payments.push(
          {
            amount: principalPayment,
            paymentType: 'principal',
            paymentDate,
            notes: `Seeded test data v1: ${loanId}: principal`,
            createdAt: paymentDate,
          },
          {
            amount: interestPayment,
            paymentType: 'interest',
            paymentDate,
            notes: `Seeded test data v1: ${loanId}: interest`,
            createdAt: paymentDate,
          },
        )
      }
      return { loanId, customerIndex, customer, property, loan, payments }
    })
    return {
      profile,
      userIndex,
      createdAt: loans[0].loan.startDate,
      loans,
    }
  })

  return { asOf: today, users }
}
