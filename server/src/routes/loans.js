import { Router } from 'express'
import { listLoans, createLoan, updateLoan, deleteLoan, getLoan } from '../controllers/loans.js'

const router = Router()

router.get('/', listLoans)
router.post('/', createLoan)
router.patch('/:id', updateLoan)
router.delete('/:id', deleteLoan)
router.get('/:id', getLoan)

export default router
