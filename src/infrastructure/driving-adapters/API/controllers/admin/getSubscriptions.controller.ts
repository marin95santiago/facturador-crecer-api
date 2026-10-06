import { NextFunction, Request, Response } from 'express'
import { AttributeValue } from '@aws-sdk/client-dynamodb'
import { SubscriptionGetterUseCase } from '../../../../../application/useCases/SubscriptionGetter'
import { DynamoDBSubscriptionRepository } from '../../../../implementations/AWS/dynamoDB/DynamoDBSubscriptionRepository'

/** Lists subscriptions of every entity using the admin API key. */
export const getSubscriptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { limit, lastEvaluatedKey } = req.query
  const subscriptionGetterUseCase = new SubscriptionGetterUseCase(new DynamoDBSubscriptionRepository())

  try {
    let parsedLimit: number | undefined
    if (limit !== undefined) {
      parsedLimit = Number(limit)
    }

    let parsedLastEvaluatedKey: Record<string, unknown> | undefined
    if (lastEvaluatedKey !== undefined) {
      const parsed: unknown = JSON.parse(lastEvaluatedKey.toString())
      if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
        parsedLastEvaluatedKey = parsed as Record<string, AttributeValue>
      }
    }

    const response = await subscriptionGetterUseCase.run(parsedLimit, parsedLastEvaluatedKey)
    res.json(response)
  } catch (error) {
    next(error)
  }
}
