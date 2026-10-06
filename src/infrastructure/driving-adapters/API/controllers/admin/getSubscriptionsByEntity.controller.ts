import { NextFunction, Request, Response } from 'express'
import { SubscriptionGetterByEntityUseCase } from '../../../../../application/useCases/SubscriptionGetterByEntity'
import { DynamoDBSubscriptionRepository } from '../../../../implementations/AWS/dynamoDB/DynamoDBSubscriptionRepository'

/** Lists the subscription history of one entity using the admin API key. */
export const getSubscriptionsByEntity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { entityId } = req.params
  const subscriptionGetterByEntityUseCase = new SubscriptionGetterByEntityUseCase(new DynamoDBSubscriptionRepository())

  try {
    const subscriptions = await subscriptionGetterByEntityUseCase.run(entityId)
    res.json({ subscriptions })
  } catch (error) {
    next(error)
  }
}
