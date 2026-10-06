import { Subscription } from '../../entities/Subscription.entity'
import { SubscriptionRepository } from '../../repositories/Subscription.repository'

export class RecordSubscriptionDocumentService {
  private readonly _subscriptionRepository: SubscriptionRepository

  constructor (subscriptionRepository: SubscriptionRepository) {
    this._subscriptionRepository = subscriptionRepository
  }

  /** Adds one accepted document to the active subscription of the entity. */
  async run (entityId: string): Promise<void> {
    const subscriptions = await this._subscriptionRepository.getByEntityId(entityId)
    const activeSubscriptions: Subscription[] = []

    for (const subscription of subscriptions) {
      if (subscription.active) {
        activeSubscriptions.push(subscription)
      }
    }

    if (activeSubscriptions.length === 0) {
      console.warn('No active subscription found for entity', { entityId })
      return
    }

    let selectedSubscription = activeSubscriptions[0]

    if (activeSubscriptions.length > 1) {
      const subscriptionIds: string[] = []
      for (const subscription of activeSubscriptions) {
        subscriptionIds.push(subscription.id)
        if (subscription.createdAt > selectedSubscription.createdAt) {
          selectedSubscription = subscription
        }
      }
      console.warn('Multiple active subscriptions found for entity', { entityId, subscriptionIds })
    }

    await this._subscriptionRepository.incrementCurrentDocuments(selectedSubscription.id)
  }
}
