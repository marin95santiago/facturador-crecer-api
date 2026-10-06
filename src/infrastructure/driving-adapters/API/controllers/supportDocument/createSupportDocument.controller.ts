import { NextFunction, Request, Response } from 'express'
import { DynamoDBEntityRepository } from '../../../../implementations/AWS/dynamoDB/DynamoDBEntityRepository'
import { DynamoDBSubscriptionRepository } from '../../../../implementations/AWS/dynamoDB/DynamoDBSubscriptionRepository'
import { validatePermission } from '../../utils'
import permissionsList from '../../permission.json'
import { PermissionNotAvailableException } from '../../../../../domain/exceptions/common/PermissionNotAvailable.exception'
import { SupportDocumentCreatorUseCase } from '../../../../../application/useCases/SupportDocumentCreactor'

export const createSupportDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { sessionUser } = req.params

  const dynamoDBEntityRepository = new DynamoDBEntityRepository()
  const electronicBillCreatorUseCase = new SupportDocumentCreatorUseCase (dynamoDBEntityRepository, new DynamoDBSubscriptionRepository())

  try {
    const session = JSON.parse(sessionUser)
    const doesSuperAdminHavePermission = true
    const havePermission = validatePermission(permissionsList.support_document.create, session.data.user.permissions, doesSuperAdminHavePermission)
    if (!havePermission) throw new PermissionNotAvailableException()

    const billCreated = await electronicBillCreatorUseCase.run({
      ...req.body,
      entityId: session.data.user.entityId,
      userId: session.data.user.id,
    })

    res.json(billCreated)
  } catch (error) {
    return next(error)
  }
}
