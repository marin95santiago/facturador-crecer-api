import path from 'path'
import * as dotenv from 'dotenv'
import {
  AttributeValue,
  DynamoDBClient,
  QueryCommand,
  ScanCommand,
  TransactWriteItem,
  TransactWriteItemsCommand,
  UpdateItemCommand
} from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import { Subscription } from '../../../../domain/entities/Subscription.entity'
import { SubscriptionRepository } from '../../../../domain/repositories/Subscription.repository'

dotenv.config({
  path: path.resolve(__dirname, '../../../../../.env')
})

const ENVIRONMENT = process.env.ENVIRONMENT || ''
const PROJECT = process.env.PROJECT || ''
const ENTITY_INDEX_NAME = 'entityId-index'

export class DynamoDBSubscriptionRepository implements SubscriptionRepository {
  private readonly client = new DynamoDBClient({ region: 'us-east-1' })
  private readonly _tableName: string

  constructor () {
    this._tableName = `${PROJECT}-${ENVIRONMENT}-Subscriptions`
  }

  /** Creates a subscription and deactivates previous active rows in one transaction. */
  async createDeactivatingPrevious (subscription: Subscription, previousActiveIds: string[]): Promise<Subscription> {
    const transactItems: TransactWriteItem[] = []

    for (const previousId of previousActiveIds) {
      transactItems.push({
        Update: {
          TableName: this._tableName,
          Key: marshall({ id: previousId }),
          UpdateExpression: 'SET active = :inactive',
          ConditionExpression: 'active = :active',
          ExpressionAttributeValues: marshall({
            ':inactive': false,
            ':active': true
          })
        }
      })
    }

    transactItems.push({
      Put: {
        TableName: this._tableName,
        Item: marshall({
          id: subscription.id,
          entityId: subscription.entityId,
          maxDocuments: subscription.maxDocuments,
          currentDocuments: subscription.currentDocuments,
          active: subscription.active,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          description: subscription.description,
          createdAt: subscription.createdAt
        }),
        ConditionExpression: 'attribute_not_exists(id)'
      }
    })

    try {
      await this.client.send(new TransactWriteItemsCommand({
        TransactItems: transactItems
      }))
      return subscription
    } catch (error) {
      console.error('Failed to create subscription transaction', { subscriptionId: subscription.id, entityId: subscription.entityId, error })
      throw error
    }
  }

  /** Lists subscriptions with a paginated table scan. */
  async getAll (limit?: number, lastEvaluatedKey?: Record<string, unknown>): Promise<{ subscriptions: Subscription[], lastEvaluatedKey: Record<string, unknown> | null }> {
    const params: {
      TableName: string
      Limit?: number
      ExclusiveStartKey?: Record<string, AttributeValue>
    } = {
      TableName: this._tableName
    }

    if (limit !== undefined) {
      params.Limit = limit
    }

    if (lastEvaluatedKey !== undefined) {
      params.ExclusiveStartKey = lastEvaluatedKey as Record<string, AttributeValue>
    }

    try {
      const response = await this.client.send(new ScanCommand(params))
      const items = response.Items ?? []
      const subscriptions: Subscription[] = []

      for (const item of items) {
        subscriptions.push(this.mapItem(item))
      }

      let nextKey: Record<string, unknown> | null = null
      if (response.LastEvaluatedKey !== undefined) {
        nextKey = response.LastEvaluatedKey
      }

      return {
        subscriptions,
        lastEvaluatedKey: nextKey
      }
    } catch (error) {
      console.error('Failed to scan subscriptions', { error })
      throw error
    }
  }

  /** Lists every subscription of an entity through the entity index. */
  async getByEntityId (entityId: string): Promise<Subscription[]> {
    const subscriptions: Subscription[] = []
    let exclusiveStartKey: Record<string, AttributeValue> | undefined

    try {
      do {
        const params: {
          TableName: string
          IndexName: string
          KeyConditionExpression: string
          ExpressionAttributeValues: Record<string, AttributeValue>
          ExclusiveStartKey?: Record<string, AttributeValue>
        } = {
          TableName: this._tableName,
          IndexName: ENTITY_INDEX_NAME,
          KeyConditionExpression: 'entityId = :entityId',
          ExpressionAttributeValues: marshall({
            ':entityId': entityId
          })
        }

        if (exclusiveStartKey !== undefined) {
          params.ExclusiveStartKey = exclusiveStartKey
        }

        const response = await this.client.send(new QueryCommand(params))
        const items = response.Items ?? []

        for (const item of items) {
          subscriptions.push(this.mapItem(item))
        }

        exclusiveStartKey = response.LastEvaluatedKey
      } while (exclusiveStartKey !== undefined)

      return subscriptions
    } catch (error) {
      console.error('Failed to query subscriptions by entity', { entityId, error })
      throw error
    }
  }

  /** Adds one accepted document to an active subscription. */
  async incrementCurrentDocuments (id: string): Promise<void> {
    try {
      await this.client.send(new UpdateItemCommand({
        TableName: this._tableName,
        Key: marshall({ id }),
        UpdateExpression: 'ADD currentDocuments :increment',
        ConditionExpression: 'active = :active',
        ExpressionAttributeValues: marshall({
          ':increment': 1,
          ':active': true
        })
      }))
    } catch (error) {
      let subscriptionAlreadyInactive = false
      if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
        subscriptionAlreadyInactive = true
      }
      if (!subscriptionAlreadyInactive) {
        console.error('Failed to increment subscription currentDocuments', { subscriptionId: id, error })
      }
      throw error
    }
  }

  /** Maps a DynamoDB item to a subscription. */
  private mapItem (item: Record<string, AttributeValue>): Subscription {
    const raw = unmarshall(item)
    let active = false
    if (raw.active === true) {
      active = true
    }

    return {
      id: String(raw.id ?? ''),
      entityId: String(raw.entityId ?? ''),
      maxDocuments: Number(raw.maxDocuments ?? 0),
      currentDocuments: Number(raw.currentDocuments ?? 0),
      active,
      startDate: String(raw.startDate ?? ''),
      endDate: String(raw.endDate ?? ''),
      description: String(raw.description ?? ''),
      createdAt: String(raw.createdAt ?? '')
    }
  }
}
