import { NextFunction, Request, Response } from 'express'
import { DynamoDBEntityRepository } from '../../../../implementations/AWS/dynamoDB/DynamoDBEntityRepository'
import { validatePermission } from '../../utils'
import permissionsList from '../../permission.json'
import { PermissionNotAvailableException } from '../../../../../domain/exceptions/common/PermissionNotAvailable.exception'
import { CreditNoteSupportDocumentGetterFromPlemsiUseCase } from '../../../../../application/useCases/CreditNoteSupportDocumentGetterFromPlemsi'

/** Returns paginated support-document credit notes from Plemsi. */
export const getCreditNoteSupportDocumentsFromPlemsi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { sessionUser } = req.params
  const { page } = req.query

  const dynamoDBEntityRepository = new DynamoDBEntityRepository()
  const creditNoteSupportDocumentGetterUseCase = new CreditNoteSupportDocumentGetterFromPlemsiUseCase(dynamoDBEntityRepository)

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

    const creditNoteList = await creditNoteSupportDocumentGetterUseCase.run(
      session.data.user.entityId,
      Number(page)
    )

    res.json(creditNoteList)
  } catch (error) {
    return next(error)
  }
}
