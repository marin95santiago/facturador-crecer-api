import { Router } from 'express'
import { validateToken } from '../middlewares/tokenHandler.middleware'
import {
  createSupportDocumentController,
  getCreditNoteSupportDocumentHTMLController,
  getCreditNoteSupportDocumentsFromPlemsiController,
  getSupportDocumentController,
  getSupportDocumentHTMLController,
  presentSupportDocumentCreditNoteController,
} from '../controllers/index'

const route = Router()

route.get('/', validateToken, getSupportDocumentController)
route.get('/credit/plemsi', validateToken, getCreditNoteSupportDocumentsFromPlemsiController)
route.get('/credit/:cude/html', validateToken, getCreditNoteSupportDocumentHTMLController)
route.get('/:cude/html', validateToken, getSupportDocumentHTMLController)
route.post('/:cude/present-credit', validateToken, presentSupportDocumentCreditNoteController)
route.post('/', validateToken, createSupportDocumentController)

export default route