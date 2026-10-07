import { Router } from 'express'

import {
  loginController,
  requestControlCodeController,
  verifyControlCodeController,
  refreshSessionController,
  logoutSessionController
} from '../controllers/index'

const route = Router()

route.post('', loginController)
route.post('/request-control-code', requestControlCodeController)
route.post('/verify-control-code', verifyControlCodeController)
route.post('/refresh', refreshSessionController)
route.post('/logout', logoutSessionController)

export default route
