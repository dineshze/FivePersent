const FIRST_START_DATE = new Date(Date.UTC(2021, 0, 15))
const DAY_MS = 24 * 60 * 60 * 1000

const terms = [6, 9, 12, 18, 24]
const interestTypes = ['monthly', 'annually']
const customerProfiles = [
  ['Ananya Sharma', 'Mumbai'],
  ['Aarav Mehta', 'Pune'],
  ['Diya Nair', 'Kochi'],
  ['Kabir Shah', 'Ahmedabad'],
  ['Mira Iyer', 'Chennai'],
  ['Rohan Das', 'Kolkata'],
  ['Aditi Patel', 'Surat'],
  ['Ishaan Rao', 'Hyderabad'],
  ['Sara Khan', 'Jaipur'],
  ['Dev Malhotra', 'Delhi'],
  ['Kavya Reddy', 'Bengaluru'],
  ['Nikhil Joshi', 'Indore'],
  ['Tara Kapoor', 'Lucknow'],
  ['Yash Gupta', 'Nagpur'],
  ['Zoya Ali', 'Bhopal'],
  ['Arjun Pillai', 'Thiruvananthapuram'],
  ['Leela Menon', 'Coimbatore'],
  ['Varun Singh', 'Noida'],
]

function addMonths(date, months) {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + months
  const day = Math.min(date.getUTCDate(), new Date(Date.UTC(year, month + 1, 0)).getUTCDate())
  return new Date(Date.UTC(year, month, day))
}

function roundMoney(amount) {
  return Math.round((amount + Number.EPSILON) * 100) / 100
}

export function buildHistorySeedFixture(referenceDate = new Date()) {
  const endDate = new Date(referenceDate)
  endDate.setUTCHours(0, 0, 0, 0)
  const span = endDate.getTime() - FIRST_START_DATE.getTime()

  const customers = customerProfiles.map(([name, city], index) => ({
    name,
    phone: index === 0 ? '+919876543210' : `+919876540${String(index + 1).padStart(3, '0')}`,
    email: index === 0 ? 'ananya.sharma@example.test' : `customer.${String(index + 1).padStart(2, '0')}@history.example.test`,
    address: `${20 + index} Sample Market Road, ${city}`,
    photo: '/customer-avatars/demo-customer.svg',
  }))

  const loans = Array.from({ length: 37 }, (_, index) => {
    const startDate = new Date(FIRST_START_DATE.getTime() + Math.round((span * index) / 36))
    const termMonths = terms[index % terms.length]
    const dueDate = addMonths(startDate, termMonths)
    const completed = index % 4 === 0 && dueDate < endDate
    const loanId = `FP-HISTORY-${String(index + 1).padStart(3, '0')}`
    const principalAmount = 15000 + ((index * 7913) % 135000)
    const interestType = interestTypes[index % interestTypes.length]

    return {
      loanId,
      customerIndex: index % customers.length,
      property: {
        name: `Pledged item ${String(index + 1).padStart(2, '0')}`,
        images: [],
        description: `Seeded collateral record for ${loanId}.`,
        estimatedValue: roundMoney(principalAmount * (1.4 + (index % 4) * 0.2)),
        notes: `Historical demo property for ${loanId}.`,
      },
      loan: {
        loanId,
        principalAmount,
        interestRate: interestType === 'monthly' ? 2 + (index % 4) : 12 + (index % 4) * 2,
        interestType,
        startDate,
        duration: `${termMonths} months`,
        dueDate,
        status: completed ? 'completed' : 'active',
        notes: `Historical sample loan ${index + 1} of 37.`,
        createdAt: startDate,
        updatedAt: startDate,
      },
    }
  })

  return {
    account: {
      name: 'Demo Acc',
      email: 'demo@gmail.com',
      phone: '+919800000037',
    },
    customers,
    loans,
  }
}

export { FIRST_START_DATE }
