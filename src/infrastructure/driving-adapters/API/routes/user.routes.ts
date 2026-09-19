import { Router } from 'express'
import { validateToken } from '../middlewares/tokenHandler.middleware'
import { validateAdminApiKey } from '../middlewares/adminApiKey.middleware'

import {
  createUserController,
  getAllUsersController,
  updateUserController,
  deleteUserController,
  getUserByIdController,
  setUserPasswordController,
  requestPasswordChangeController,
  forgotPasswordController
} from '../controllers/index'

const route = Router()

route.post('/password/request', validateToken, requestPasswordChangeController)
route.post('/password/forgot', forgotPasswordController)
route.post('/password', setUserPasswordController)
route.post('', validateAdminApiKey, createUserController)
route.delete('/:userId', validateToken, deleteUserController)
route.put('/:userId', validateToken, updateUserController)
route.get('', validateToken, getAllUsersController)
route.get('/:userId', getUserByIdController)

export default route
