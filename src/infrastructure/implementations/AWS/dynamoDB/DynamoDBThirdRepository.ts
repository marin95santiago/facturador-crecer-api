import path from 'path'
import * as dotenv from 'dotenv'
import { DynamoDBClient, PutItemCommand, QueryCommand, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall } from '@aws-sdk/util-dynamodb'
import { ThirdRepository } from '../../../../domain/repositories/Third.repository'
import { Third } from '../../../../domain/entities/Third.entity'
import { batchDeleteItems } from './batchDeleteItems'

dotenv.config({
  path: path.resolve(__dirname, '../../../../../.env')
})

const ENVIRONMENT = process.env.ENVIRONMENT || ''
const PROJECT = process.env.PROJECT || ''

export class DynamoDBThirdRepository implements ThirdRepository {
  private readonly client = new DynamoDBClient({ region: 'us-east-1' })
  private readonly _environment: string
  private readonly _project: string
  private readonly _table: string

  constructor () {
    this._environment = ENVIRONMENT
    this._project = PROJECT
    this._table = 'Thirds'
  }

  async save(third: Third): Promise<Third> {
    const params = {
      TableName: `${this._project}-${this._environment}-${this._table}`,
      Item: marshall({
        entityId: third.entityId ?? '',
        document: third.document ?? '',
        dv: third.dv ?? null,
        documentType: third.documentType ?? null,
        organizationType: third.organizationType ?? null,
        liabilityType: third.liabilityType ?? null,
        regimeType: third.regimeType ?? null,
        name: third.name ?? null,
        lastname: third.lastname ?? null,
        businessName: third.businessName ?? null,
        phone: third.phone ?? null,
        address: third.address ?? null,
        city: third.city ?? null,
        email: third.email ?? null
      })
    }

    await this.client.send(new PutItemCommand(params))
    
    return third
  }

  async update(third: Third): Promise<Third> {
    const params = {
      TableName: `${this._project}-${this._environment}-${this._table}`,
      Item: marshall({
        entityId: third.entityId ?? '',
        document: third.document ?? '',
        dv: third.dv ?? null,
        documentType: third.documentType ?? null,
        organizationType: third.organizationType ?? null,
        liabilityType: third.liabilityType ?? null,
        regimeType: third.regimeType ?? null,
        name: third.name ?? null,
        lastname: third.lastname ?? null,
        businessName: third.businessName ?? null,
        phone: third.phone ?? null,
        address: third.address ?? null,
        city: third.city ?? null,
        email: third.email ?? null
      })
    }
    await this.client.send(new PutItemCommand(params))

    return third
  }

  async getAll(entityId: string, limit?: number, lastEvaluatedKey?: any): Promise<{lastEvaluatedKey: any, thirds: Third[]}> {
    const params : {
      TableName: string
      IndexName: string
      KeyConditionExpression: string
      ExpressionAttributeValues: any
      ExclusiveStartKey?: any
      Limit?: number
    } = {
      TableName: `${this._project}-${this._environment}-${this._table}`,
      IndexName: 'entityId-index',
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

    const items = (response.Items !== undefined) ? response.Items : []

    const thirds = items.map((item: any) => {
      return {
        entityId: item.entityId.S ?? '',
        document: item.document.S ?? '',
        dv: item.dv.S ?? undefined,
        documentType: item.documentType.M !== undefined
          ?
            {
              code: item.documentType.M.code.S ?? '',
              description: item.documentType.M.description.S ?? ''
            }
          : { code: '', description: '' },
        organizationType: item.organizationType.M !== undefined
          ?
            {
              code: item.organizationType.M.code.S ?? '',
              description: item.organizationType.M.description.S ?? ''
            }
          : { code: '', description: '' },
        liabilityType: item.liabilityType.M !== undefined
          ?
            {
              code: item.liabilityType.M.code.S ?? '',
              description: item.liabilityType.M.description.S ?? ''
            }
          : { code: '', description: '' },
        regimeType: item.regimeType.M !== undefined
          ?
            {
              code: item.regimeType.M.code.S ?? '',
              description: item.regimeType.M.description.S ?? ''
            }
          : { code: '', description: '' },
        name: item.name.S ?? undefined,
        lastname: item.lastname.S ?? undefined,
        businessName: item.businessName.S ?? undefined,
        phone: item.phone.S ?? '',
        address: item.address.S ?? '',
        city: item.city?.M !== undefined
          ?
            {
              code: item.city.M.code.S ?? '',
              description: item.city.M.description.S ?? ''
            }
          : undefined,
        email: item.email.S ?? ''
      }
    })
    
    return {
      lastEvaluatedKey: response.LastEvaluatedKey,
      thirds: thirds
    }
  }

  async getByDocument(document: string, entityId: string): Promise<Third | null> {
    const params = {
      TableName: `${this._project}-${this._environment}-${this._table}`,
      Key: marshall({
        document,
        entityId
      })
    }
  
    const response = await this.client.send(new GetItemCommand(params))

    const item = (response.Item !== undefined) ? response.Item : null

    if (item === null) return null

    const third = {
      entityId: item.entityId.S ?? '',
      document: item.document.S ?? '',
      dv: item.dv.S ?? undefined,
      documentType: item.documentType.M !== undefined
        ?
          {
            code: item.documentType.M.code.S ?? '',
            description: item.documentType.M.description.S ?? ''
          }
        : { code: '', description: '' },
      organizationType: item.organizationType.M !== undefined
        ?
          {
            code: item.organizationType.M.code.S ?? '',
            description: item.organizationType.M.description.S ?? ''
          }
        : { code: '', description: '' },
      liabilityType: item.liabilityType.M !== undefined
        ?
          {
            code: item.liabilityType.M.code.S ?? '',
            description: item.liabilityType.M.description.S ?? ''
          }
        : { code: '', description: '' },
      regimeType: item.regimeType.M !== undefined
        ?
          {
            code: item.regimeType.M.code.S ?? '',
            description: item.regimeType.M.description.S ?? ''
          }
        : { code: '', description: '' },
      name: item.name.S ?? undefined,
      lastname: item.lastname.S ?? undefined,
      businessName: item.businessName.S ?? undefined,
      phone: item.phone.S ?? '',
      address: item.address.S ?? '',
      city: item.city?.M !== undefined
        ?
          {
            code: item.city.M.code.S ?? '',
            description: item.city.M.description.S ?? ''
          }
        : undefined,
      email: item.email.S ?? ''
    }

    return third
  }

  /** Deletes all thirds belonging to an entity and returns the deleted count. */
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
        IndexName: 'entityId-index',
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
        if (item.document?.S !== undefined && item.entityId?.S !== undefined) {
          keysToDelete.push({
            document: item.document.S,
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
