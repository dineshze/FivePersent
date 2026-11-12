import { Router } from 'express'
import Loan from '../models/Loan.js'
import { asyncHandler } from '../utils/http.js'
import { getLoanStatus } from '../utils/interest.js'

const router = Router()

router.get('/:loanId', asyncHandler(async (request, response) => {
  const loan = await Loan.findOne({ loanId: request.params.loanId })
    .select('loanId status startDate dueDate')
    .lean()
  if (!loan) return response.status(404).json({ message: 'No loan was found with that ID. Check the ID and try again.' })
  return response.json({
    loanId: loan.loanId,
    status: getLoanStatus(loan),
    startDate: loan.startDate,
    dueDate: loan.dueDate,
  })
}))

export default router
