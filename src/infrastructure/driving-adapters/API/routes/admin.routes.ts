import { Router } from 'express'
import { deleteEntityAdmin } from '../controllers/admin/deleteEntity.controller'
import { rebuildPasswordSetupLink } from '../controllers/admin/rebuildPasswordSetupLink.controller'
import { validateAdminApiKey } from '../middlewares/adminApiKey.middleware'

const route = Router()

route.post('/users/:email/password-setup-link', validateAdminApiKey, rebuildPasswordSetupLink)
route.delete('/entities/:entityId', validateAdminApiKey, deleteEntityAdmin)

export default route
