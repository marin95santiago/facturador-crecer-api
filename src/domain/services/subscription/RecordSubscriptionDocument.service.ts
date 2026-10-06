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

    // #region agent log
    fetch('http://127.0.0.1:7681/ingest/94cb4c4d-d60a-471e-a1c1-d82286125dd6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'bbda89'},body:JSON.stringify({sessionId:'bbda89',runId:'post-fix',hypothesisId:'A',location:'RecordSubscriptionDocument.service.ts:run',message:'Incrementing subscription counter',data:{entityId,subscriptionId:selectedSubscription.id,subscriptionEntityId:selectedSubscription.entityId},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    await this._subscriptionRepository.incrementCurrentDocuments(selectedSubscription.id, selectedSubscription.entityId)
  }
}
