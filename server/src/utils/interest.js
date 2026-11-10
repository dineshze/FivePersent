const DAY_MS = 24 * 60 * 60 * 1000

function completeMonths(start, end) {
  let months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12
    + end.getUTCMonth() - start.getUTCMonth()
  const anniversary = monthAnniversary(start, months)
  if (anniversary > end) months -= 1
  return Math.max(months, 0)
}

function monthAnniversary(start, months) {
  const year = start.getUTCFullYear()
  const month = start.getUTCMonth() + months
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  return new Date(Date.UTC(
    year,
    month,
    Math.min(start.getUTCDate(), lastDay),
    start.getUTCHours(),
    start.getUTCMinutes(),
    start.getUTCSeconds(),
    start.getUTCMilliseconds(),
  ))
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function calculateInterest(loan, payments = [], asOf = new Date()) {
  const start = new Date(loan.startDate)
  const end = new Date(asOf)
  const effectiveEnd = end < start ? start : end
  const elapsedDays = Math.floor((effectiveEnd - start) / DAY_MS)
  const relevantPayments = payments.filter((payment) => {
    const paymentDate = new Date(payment.paymentDate)
    return paymentDate >= start && paymentDate <= effectiveEnd
  })
  const principalPaid = relevantPayments
    .filter((payment) => payment.paymentType === 'principal')
    .reduce((sum, payment) => sum + payment.amount, 0)
  const interestPaid = relevantPayments
    .filter((payment) => payment.paymentType === 'interest')
    .reduce((sum, payment) => sum + payment.amount, 0)
  const principalPayments = relevantPayments
    .filter((payment) => payment.paymentType === 'principal')
    .sort((left, right) => new Date(left.paymentDate) - new Date(right.paymentDate))
  let accrued = 0
  if (loan.interestType === 'monthly') {
    const periods = completeMonths(start, effectiveEnd)
    for (let period = 0; period < periods; period += 1) {
      const periodStart = monthAnniversary(start, period)
      const principalAtPeriodStart = Math.max(0, loan.principalAmount - principalPayments
        .filter((payment) => new Date(payment.paymentDate) <= periodStart)
        .reduce((sum, payment) => sum + payment.amount, 0))
      accrued += principalAtPeriodStart * (loan.interestRate / 100)
    }
  } else {
    let cursor = start
    let outstandingAtCursor = loan.principalAmount
    for (const payment of principalPayments) {
      const paymentDate = new Date(payment.paymentDate)
      if (paymentDate > cursor) {
        const days = (paymentDate - cursor) / DAY_MS
        accrued += outstandingAtCursor * (loan.interestRate / 100) * (days / 365)
        cursor = paymentDate
      }
      outstandingAtCursor = Math.max(0, outstandingAtCursor - payment.amount)
    }
    if (effectiveEnd > cursor) {
      const days = (effectiveEnd - cursor) / DAY_MS
      accrued += outstandingAtCursor * (loan.interestRate / 100) * (days / 365)
    }
  }
  const accumulatedInterest = roundMoney(accrued)
  const outstandingPrincipal = roundMoney(Math.max(0, loan.principalAmount - principalPaid))
  const outstandingInterest = roundMoney(Math.max(0, accumulatedInterest - interestPaid))
  return {
    principalAmount: roundMoney(loan.principalAmount),
    interestRate: loan.interestRate,
    interestType: loan.interestType,
    elapsedDays,
    accumulatedInterest,
    outstandingPrincipal,
    outstandingInterest,
    totalOutstanding: roundMoney(outstandingPrincipal + outstandingInterest),
  }
}

export function getLoanStatus(loan, today = new Date()) {
  if (loan.status === 'completed') return 'completed'
  const due = new Date(loan.dueDate)
  const currentDate = new Date(today)
  currentDate.setUTCHours(0, 0, 0, 0)
  due.setUTCHours(0, 0, 0, 0)
  return due < currentDate ? 'overdue' : 'active'
}

export function serializeLoan(loan, payments) {
  const record = loan.toObject ? loan.toObject() : { ...loan }
  return {
    ...record,
    status: getLoanStatus(record),
    calculation: calculateInterest(record, payments),
  }
}
