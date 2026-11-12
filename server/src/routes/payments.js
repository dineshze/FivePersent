import { Router } from 'express'
import { listPayments, createPayment } from '../controllers/payments.js'

const router = Router()

router.get('/', listPayments)
router.post('/', createPayment)

export default router
