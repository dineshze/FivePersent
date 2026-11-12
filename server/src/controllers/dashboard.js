import Customer from "../models/Customer.js";
import Loan from "../models/Loan.js";
import Payment from "../models/Payment.js";
import { asyncHandler } from "../utils/http.js";
import { calculateInterest, getLoanStatus } from "../utils/interest.js";

export const getDashboard = asyncHandler(async (request, response) => {
  const [loans, payments, totalCustomers] = await Promise.all([
    Loan.find({ userId: request.userId }).lean(),
    Payment.find({ userId: request.userId }).lean(),
    Customer.countDocuments({ userId: request.userId }),
  ]);
  const paymentMap = payments.reduce((map, payment) => {
    const key = String(payment.loanId);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(payment);
    return map;
  }, new Map());
  const calculated = loans.map((loan) => {
    const loanPayments = paymentMap.get(String(loan._id)) || [];
    return {
      status: getLoanStatus(loan),
      calculation: calculateInterest(loan, loanPayments),
    };
  });
  return response.json({
    totalLoans: loans.length,
    totalLoanAmount: loans.reduce((sum, loan) => sum + loan.principalAmount, 0),
    activeLoans: calculated.filter(({ status }) => status === "active").length,
    overdueLoans: calculated.filter(({ status }) => status === "overdue")
      .length,
    totalCustomers,
    totalInterestEarned: calculated.reduce(
      (sum, item) => sum + item.calculation.accumulatedInterest,
      0,
    ),
    activePrincipal: calculated
      .filter(({ status }) => status !== "completed")
      .reduce((sum, item) => sum + item.calculation.outstandingPrincipal, 0),
    totalPayments: payments.reduce((sum, payment) => sum + payment.amount, 0),
  });
});
