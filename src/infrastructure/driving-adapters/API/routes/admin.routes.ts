import { Router } from 'express'
import { deleteEntityAdmin } from '../controllers/admin/deleteEntity.controller'
import { rebuildPasswordSetupLink } from '../controllers/admin/rebuildPasswordSetupLink.controller'
import { createSubscription } from '../controllers/admin/createSubscription.controller'
import { getSubscriptions } from '../controllers/admin/getSubscriptions.controller'
import { getSubscriptionsByEntity } from '../controllers/admin/getSubscriptionsByEntity.controller'
import { validateAdminApiKey } from '../middlewares/adminApiKey.middleware'

const route = Router()

route.post('/users/:email/password-setup-link', validateAdminApiKey, rebuildPasswordSetupLink)
route.delete('/entities/:entityId', validateAdminApiKey, deleteEntityAdmin)
route.post('/subscriptions', validateAdminApiKey, createSubscription)
route.get('/subscriptions/entity/:entityId', validateAdminApiKey, getSubscriptionsByEntity)
route.get('/subscriptions', validateAdminApiKey, getSubscriptions)

export default route
