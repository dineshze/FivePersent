import { Router } from 'express'
import { listCustomers, updateCustomer } from '../controllers/customers.js'

const router = Router()

router.get('/', listCustomers)
router.patch('/:id', updateCustomer)

export default router
