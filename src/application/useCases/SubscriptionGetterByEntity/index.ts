import { Subscription } from '../../../domain/entities/Subscription.entity'
import { SubscriptionRepository } from '../../../domain/repositories/Subscription.repository'

export class SubscriptionGetterByEntityUseCase {
  private readonly _subscriptionRepository: SubscriptionRepository

  constructor (subscriptionRepository: SubscriptionRepository) {
    this._subscriptionRepository = subscriptionRepository
  }

  /** Lists the subscription history of one entity, active and inactive. */
  async run (entityId: string): Promise<Subscription[]> {
    try {
      return await this._subscriptionRepository.getByEntityId(entityId)
    } catch (error) {
      console.error('Failed to list subscriptions by entity', { entityId, error })
      throw error
    }
  }
}
