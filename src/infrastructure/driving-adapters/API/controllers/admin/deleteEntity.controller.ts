import { NextFunction, Request, Response } from 'express'
import { EntityCascadeDeleterUseCase } from '../../../../../application/useCases/EntityCascadeDeleter'
import { DynamoDBAuthTokenRepository } from '../../../../implementations/AWS/dynamoDB/DynamoDBAuthTokenRepository'
import { DynamoDBElectronicBillRepository } from '../../../../implementations/AWS/dynamoDB/DynamoDBElectronicBillRepository'
import { DynamoDBEntityRepository } from '../../../../implementations/AWS/dynamoDB/DynamoDBEntityRepository'
import { DynamoDBItemRepository } from '../../../../implementations/AWS/dynamoDB/DynamoDBItemRepository'
import { DynamoDBScheduleRepository } from '../../../../implementations/AWS/dynamoDB/DynamoDBScheduleRepository'
import { DynamoDBThirdRepository } from '../../../../implementations/AWS/dynamoDB/DynamoDBThirdRepository'
import { DynamoDBUserRepository } from '../../../../implementations/AWS/dynamoDB/DynamoDBUserRepository'

/** Deletes an entity and all related records using the admin API key. */
export const deleteEntityAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { entityId } = req.params

  const entityCascadeDeleterUseCase = new EntityCascadeDeleterUseCase(
    new DynamoDBEntityRepository(),
    new DynamoDBUserRepository(),
    new DynamoDBThirdRepository(),
    new DynamoDBItemRepository(),
    new DynamoDBElectronicBillRepository(),
    new DynamoDBScheduleRepository(),
    new DynamoDBAuthTokenRepository()
  )

  try {
    const result = await entityCascadeDeleterUseCase.run(entityId)
    res.json(result)
  } catch (error) {
    next(error)
  }
}
