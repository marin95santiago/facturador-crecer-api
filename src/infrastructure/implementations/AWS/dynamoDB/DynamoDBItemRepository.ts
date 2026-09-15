import path from 'path'
import * as dotenv from 'dotenv'
import { DynamoDBClient, PutItemCommand, GetItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb'
import { marshall } from '@aws-sdk/util-dynamodb'
import { ItemRepository } from '../../../../domain/repositories/Item.repository'
import { Item } from '../../../../domain/entities/Item.entity'
import { batchDeleteItems } from './batchDeleteItems'

dotenv.config({
  path: path.resolve(__dirname, '../../../../../.env')
})

const ENVIRONMENT = process.env.ENVIRONMENT || ''
const PROJECT = process.env.PROJECT || ''

export class DynamoDBItemRepository implements ItemRepository {
  private readonly client = new DynamoDBClient({ region: 'us-east-1' })
  private readonly _environment: string
  private readonly _project: string
  private readonly _table: string

  constructor () {
    this._environment = ENVIRONMENT
    this._project = PROJECT
    this._table = 'Items'
  }

  async save(item: Item): Promise<Item> {
    try {
      const params = {
        TableName: `${this._project}-${this._environment}-${this._table}`,
        Item: marshall({
          entityId: item.entityId ?? '',
          code: item.code ?? '',
          account: item.account ? Number(item.account) : undefined,
          description: item.description ?? '',
          price: Number(item.price) ?? null,
          unitMeasure: {
            code: item.unitMeasure?.code ? Number(item.unitMeasure.code) : undefined,
            description: item.unitMeasure?.description ?? undefined,
          },
          itemType: {
            code: item.itemType?.code ? Number(item.itemType.code) : undefined,
            description: item.itemType?.description ?? undefined,
          }
        },{
          removeUndefinedValues: true
        })
      }
  
      await this.client.send(new PutItemCommand(params))
      
      return item
    } catch (error) {
      throw error
    }
  }

  async update(item: Item): Promise<Item> {
    const params = {
      TableName: `${this._project}-${this._environment}-${this._table}`,
      Item: marshall({
        entityId: item.entityId ?? '',
        code: item.code ?? '',
        account: item.account ? Number(item.account) : undefined,
        description: item.description ?? '',
        price: Number(item.price) ?? null,
        unitMeasure: {
          code: item.unitMeasure?.code ? Number(item.unitMeasure.code) : undefined,
          description: item.unitMeasure?.description ?? undefined,
        },
        itemType: {
          code: item.itemType?.code ? Number(item.itemType.code) : undefined,
          description: item.itemType?.description ?? undefined,
        }
      },{
        removeUndefinedValues: true
      })
    }
    await this.client.send(new PutItemCommand(params))

    return item
  }

  async getAll(entityId: string, limit?: number, lastEvaluatedKey?: any): Promise<{lastEvaluatedKey: any, items: Item[]}> {
    const params : {
      TableName: string
      IndexName: string
      KeyConditionExpression: string
      ExpressionAttributeValues: any
      ExclusiveStartKey?: any
      Limit?: number
    } = {
      TableName: `${this._project}-${this._environment}-${this._table}`,
      IndexName: 'entityId-code-index',
      KeyConditionExpression: 'entityId = :entityId',
      ExpressionAttributeValues: {
        ':entityId': {
          S: entityId
        }
      }
    }

    if (limit !== undefined) {
      params.Limit = limit
    }

    if (lastEvaluatedKey !== undefined) {
      params.ExclusiveStartKey = lastEvaluatedKey
    }
    const response = await this.client.send(new QueryCommand(params))

    const itemsDB = (response.Items !== undefined) ? response.Items : []

    const items = itemsDB.map((item: any) => {
      return {
        entityId: item.entityId.S ?? '',
        code: item.code.S ?? '',
        account: item.account?.N ? Number(item.account.N) : undefined,
        description: item.description.S ?? '',
        price: Number(item.price.S ?? item.price.N) ?? undefined, // some products are string (fix this into db)
        unitMeasure: item.unitMeasure.M !== undefined
          ?
            {
              code: Number(item.unitMeasure.M.code.N) ?? 0,
              description: item.unitMeasure.M.description.S ?? ''
            }
          : undefined,
        itemType: item.itemType?.M !== undefined
          ?
            {
              code: Number(item.itemType.M.code.N) ?? 0,
              description: item.itemType.M.description.S ?? ''
            }
          : undefined
      }
    })
    
    return{
      lastEvaluatedKey: response.LastEvaluatedKey,
      items: items
    }
  }

  async getByCode(code: string, entityId: string): Promise<Item | null> {
    const params = {
      TableName: `${this._project}-${this._environment}-${this._table}`,
      Key: marshall({
        code,
        entityId
      })
    }
  
    const response = await this.client.send(new GetItemCommand(params))

    const itemDB = (response.Item !== undefined) ? response.Item : null

    if (itemDB === null) return null

    const item = {
      entityId: itemDB.entityId.S ?? '',
      code: itemDB.code.S ?? '',
      account: itemDB.account?.N ? Number(itemDB.account.N) : undefined, 
      description: itemDB.description.S ?? '',
      price: Number(itemDB.price.S ?? itemDB.price.N) ?? undefined, // some products are string (fix this into db)
      unitMeasure: itemDB.unitMeasure.M !== undefined
        ?
          {
            code: Number(itemDB.unitMeasure.M.code.N) ?? 0,
            description: itemDB.unitMeasure.M.description.S ?? ''
          }
        : undefined,
      itemType: itemDB.itemType?.M !== undefined
        ?
          {
            code: Number(itemDB.itemType.M.code.N) ?? 0,
            description: itemDB.itemType.M.description.S ?? ''
          }
        : undefined
    }

    return item
  }

  /** Deletes all items belonging to an entity and returns the deleted count. */
  async deleteByEntityId (entityId: string): Promise<number> {
    const tableName = `${this._project}-${this._environment}-${this._table}`
    const keysToDelete: Record<string, unknown>[] = []
    let lastEvaluatedKey: any

    do {
      const params: {
        TableName: string
        IndexName: string
        KeyConditionExpression: string
        ExpressionAttributeValues: any
        ExclusiveStartKey?: any
      } = {
        TableName: tableName,
        IndexName: 'entityId-code-index',
        KeyConditionExpression: 'entityId = :entityId',
        ExpressionAttributeValues: {
          ':entityId': {
            S: entityId
          }
        }
      }

      if (lastEvaluatedKey !== undefined) {
        params.ExclusiveStartKey = lastEvaluatedKey
      }

      const response = await this.client.send(new QueryCommand(params))
      const items = response.Items ?? []

      for (const item of items) {
        if (item.code?.S !== undefined && item.entityId?.S !== undefined) {
          keysToDelete.push({
            code: item.code.S,
            entityId: item.entityId.S
          })
        }
      }

      lastEvaluatedKey = response.LastEvaluatedKey
    } while (lastEvaluatedKey !== undefined)

    if (keysToDelete.length === 0) {
      return 0
    }

    return batchDeleteItems(this.client, tableName, keysToDelete)
  }
}
