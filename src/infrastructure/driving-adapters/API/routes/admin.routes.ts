import { Router } from 'express'
import { deleteEntityAdmin } from '../controllers/admin/deleteEntity.controller'
import { validateAdminApiKey } from '../middlewares/adminApiKey.middleware'

const route = Router()

route.delete('/entities/:entityId', validateAdminApiKey, deleteEntityAdmin)

export default route
