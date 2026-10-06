import { NextFunction, Request, Response } from 'express'
import { SubscriptionCreatorUseCase } from '../../../../../application/useCases/SubscriptionCreator'
import { DynamoDBEntityRepository } from '../../../../implementations/AWS/dynamoDB/DynamoDBEntityRepository'
import { DynamoDBSubscriptionRepository } from '../../../../implementations/AWS/dynamoDB/DynamoDBSubscriptionRepository'

/** Creates an active subscription for an entity using the admin API key. */
export const createSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const subscriptionCreatorUseCase = new SubscriptionCreatorUseCase(
    new DynamoDBSubscriptionRepository(),
    new DynamoDBEntityRepository()
  )

  try {
    const subscription = await subscriptionCreatorUseCase.run(req.body)
    res.status(201).json(subscription)
  } catch (error) {
    next(error)
  }
}
