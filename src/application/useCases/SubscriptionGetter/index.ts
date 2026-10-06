import { Subscription } from '../../../domain/entities/Subscription.entity'
import { SubscriptionRepository } from '../../../domain/repositories/Subscription.repository'

export class SubscriptionGetterUseCase {
  private readonly _subscriptionRepository: SubscriptionRepository

  constructor (subscriptionRepository: SubscriptionRepository) {
    this._subscriptionRepository = subscriptionRepository
  }

  /** Lists subscriptions of every entity using a paginated scan. */
  async run (limit?: number, lastEvaluatedKey?: Record<string, unknown>): Promise<{ subscriptions: Subscription[], lastEvaluatedKey: Record<string, unknown> | null }> {
    try {
      return await this._subscriptionRepository.getAll(limit, lastEvaluatedKey)
    } catch (error) {
      console.error('Failed to list subscriptions', { error })
      throw error
    }
  }
}
