import { NextFunction, Request, Response } from 'express'
import { DynamoDBEntityRepository } from '../../../../implementations/AWS/dynamoDB/DynamoDBEntityRepository'
import { PlemsiDocumentService } from '../../../../../domain/services/electronicBill/PlemsiDocument.service'
import { generateElectronicCreditNoteSupportDocumentHTML } from '../../../../../domain/services/utils/pdf.helper'
import { validatePermission } from '../../utils'
import permissionsList from '../../permission.json'
import { PermissionNotAvailableException } from '../../../../../domain/exceptions/common/PermissionNotAvailable.exception'

/** Returns printable HTML for a support-document credit note by CUDE. */
export const getCreditNoteSupportDocumentHTML = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { cude } = req.params
  const { sessionUser } = req.params

  const dynamoDBEntityRepository = new DynamoDBEntityRepository()
  const plemsiDocumentService = new PlemsiDocumentService()

  try {
    const session = JSON.parse(sessionUser)
    const doesSuperAdminHavePermission = true
    const havePermission = validatePermission(
      permissionsList.support_document.list_credit_note,
      session.data.user.permissions,
      doesSuperAdminHavePermission
    )

    if (!havePermission) {
      throw new PermissionNotAvailableException()
    }

    const entity = await dynamoDBEntityRepository.getById(session.data.user.entityId)
    if (!entity) {
      throw new Error('Entidad no encontrada')
    }

    const creditNoteData = await plemsiDocumentService.getElectronicCreditNoteSupportDocument(entity, cude)

    if (!creditNoteData?.data) {
      throw new Error('Nota crédito de documento soporte no encontrada')
    }

    const htmlContent = await generateElectronicCreditNoteSupportDocumentHTML(creditNoteData, entity)

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Content-Disposition', `inline; filename="nota-credito-documento-soporte-${cude}.html"`)

    res.send(htmlContent)
  } catch (error) {
    return next(error)
  }
}
