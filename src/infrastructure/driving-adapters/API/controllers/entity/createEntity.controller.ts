import { NextFunction, Request, Response } from 'express'
import { DynamoDBEntityRepository } from '../../../../implementations/AWS/dynamoDB/DynamoDBEntityRepository'
import { EntityCreatorUseCase } from '../../../../../application/useCases/EntityCreator'
import { validatePermission } from '../../utils'
import permissionsList from '../../permission.json'
import { PermissionNotAvailableException } from '../../../../../domain/exceptions/common/PermissionNotAvailable.exception'
import { v4 as uuidv4 } from 'uuid'

export const createEntity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const {
    name,
    entityTypeCode,
    document,
    dv,
    signatories,
    address,
    email,
    phone,
    apiKeyPlemsi,
    state,
    resolution,
    resolutionText,
    lastElectronicBillNumber,
    resolutionNC,
    resolutionTextNC,
    lastCreditNumber,
    prefixNC,
    resolutionDS,
    resolutionTextDS,
    lastSupportDocumentNumber,
    prefix,
    resolutionNCDS,
    resolutionTextNCDS,
    prefixNCDS,
    lastCreditSupportDocumentNumber
  } = req.body

  const { sessionUser } = req.params

  const dynamoDBEntityRepository = new DynamoDBEntityRepository()
  const entityCreatorUseCase = new EntityCreatorUseCase(dynamoDBEntityRepository)

  try {
    const session = JSON.parse(sessionUser)
    const doesSuperAdminHavePermission = true
    const havePermission = validatePermission(permissionsList.entity.create, session.data.user.permissions, doesSuperAdminHavePermission)

    if (!havePermission) throw new PermissionNotAvailableException()

    const entityCreated = await entityCreatorUseCase.run({
      id: uuidv4(),
      name,
      entityTypeCode,
      document,
      dv,
      signatories,
      address,
      email,
      phone,
      apiKeyPlemsi,
      state: state || 'ACTIVE',
      resolution,
      resolutionText,
      lastElectronicBillNumber,
      resolutionNC,
      resolutionTextNC,
      lastCreditNumber,
      prefixNC,
      resolutionDS,
      resolutionTextDS,
      lastSupportDocumentNumber,
      prefix,
      resolutionNCDS,
      resolutionTextNCDS,
      prefixNCDS,
      lastCreditSupportDocumentNumber
    })

    res.json(entityCreated)
  } catch (error) {
    return next(error)
  }
}
