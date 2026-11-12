import { Router } from 'express'
import { getDashboard } from '../controllers/dashboard.js'

const router = Router()

router.get('/', getDashboard)

export default router
