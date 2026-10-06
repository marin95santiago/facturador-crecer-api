import { Subscription } from '../entities/Subscription.entity'

export interface SubscriptionRepository {
  /** Creates a subscription and deactivates previous active rows in one transaction. */
  createDeactivatingPrevious: (subscription: Subscription, previousActiveIds: string[]) => Promise<Subscription>
  /** Lists subscriptions with a paginated table scan. */
  getAll: (limit?: number, lastEvaluatedKey?: Record<string, unknown>) => Promise<{ subscriptions: Subscription[], lastEvaluatedKey: Record<string, unknown> | null }>
  /** Lists every subscription of an entity through the entity index. */
  getByEntityId: (entityId: string) => Promise<Subscription[]>
  /** Adds one accepted document to an active subscription. */
  incrementCurrentDocuments: (id: string) => Promise<void>
}
