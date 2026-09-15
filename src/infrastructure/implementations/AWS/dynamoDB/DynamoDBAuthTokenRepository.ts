import path from 'path'
import * as dotenv from 'dotenv'
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
  QueryCommand,
  ScanCommand,
  UpdateItemCommand
} from '@aws-sdk/client-dynamodb'
import { marshall } from '@aws-sdk/util-dynamodb'
import type { AuthTokenRepository, PendingControlCode } from '../../../../domain/repositories/AuthToken.repository'
import { batchDeleteItems } from './batchDeleteItems'

dotenv.config({
  path: path.resolve(__dirname, '../../../../../.env')
})

const ENVIRONMENT = process.env.ENVIRONMENT ?? ''
const PROJECT = process.env.PROJECT ?? ''
const TABLE_NAME = '2AuthTokens'

const GSI_REQUESTED_BY = 'requestedBy-index'
const BLOCKED_EMAIL_PREFIX = 'BLOCKED_EMAIL#'
const BLOCKED_IP_PREFIX = 'BLOCKED_IP#'
const IP_ATTEMPTS_PREFIX = 'IP_ATTEMPTS#'
const BLOCK_SK = 'BLOCKED'
const ATTEMPTS_SK = 'ATTEMPTS'

function itemToPending (item: Record<string, any>): PendingControlCode {
  return {
    code: item.code?.S ?? '',
    expiration: Number(item.expiration?.N ?? 0),
    entityId: item.entityId?.S ?? '',
    requestedBy: item.requestedBy?.S ?? '',
    requestNumber: Number(item.requestNumber?.N ?? 1)
  }
}

export class DynamoDBAuthTokenRepository implements AuthTokenRepository {
  private readonly client = new DynamoDBClient({ region: 'us-east-1' })
  private readonly tableName = `${PROJECT}-${ENVIRONMENT}-${TABLE_NAME}`

  async saveCode (email: string, data: PendingControlCode): Promise<void> {
    const ttlSeconds = Math.floor(data.expiration / 1000)
    await this.client.send(new PutItemCommand({
      TableName: this.tableName,
      Item: marshall({
        code: data.code,
        entityId: data.entityId,
        requestedBy: data.requestedBy,
        expiration: data.expiration,
        requestNumber: data.requestNumber,
        ttl: ttlSeconds
      })
    }))
  }

  async getCodeByEmail (email: string): Promise<PendingControlCode | null> {
    const emailLower = email.toLowerCase()
    const response = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: GSI_REQUESTED_BY,
      KeyConditionExpression: 'requestedBy = :email',
      ExpressionAttributeValues: marshall({ ':email': emailLower })
    }))
    const items = response.Items ?? []
    if (items.length === 0) return null
    const sorted = items.sort((a, b) => Number(b.expiration?.N ?? 0) - Number(a.expiration?.N ?? 0))
    return itemToPending(sorted[0])
  }

  async getByCode (code: string): Promise<PendingControlCode | null> {
    const codeUpper = code.trim().toUpperCase()
    const response = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: '#code = :code',
      ExpressionAttributeNames: { '#code': 'code' },
      ExpressionAttributeValues: marshall({ ':code': codeUpper })
    }))
    const items = response.Items ?? []
    if (items.length === 0) return null
    return itemToPending(items[0])
  }

  async deleteCode (code: string, entityId: string): Promise<void> {
    const codeUpper = code.trim().toUpperCase()
    await this.client.send(new DeleteItemCommand({
      TableName: this.tableName,
      Key: marshall({ code: codeUpper, entityId })
    }))
  }

  async getEmailBlock (email: string): Promise<{ blockedUntil: number } | null> {
    const pk = BLOCKED_EMAIL_PREFIX + email.toLowerCase()
    const response = await this.client.send(new GetItemCommand({
      TableName: this.tableName,
      Key: marshall({ code: pk, entityId: BLOCK_SK })
    }))
    const item = response.Item
    if (!item || item.blockedUntil?.N == null) return null
    return { blockedUntil: Number(item.blockedUntil.N) }
  }

  async setEmailBlock (email: string, blockedUntil: number): Promise<void> {
    const pk = BLOCKED_EMAIL_PREFIX + email.toLowerCase()
    const ttlSeconds = Math.floor(blockedUntil / 1000)
    await this.client.send(new PutItemCommand({
      TableName: this.tableName,
      Item: marshall({
        code: pk,
        entityId: BLOCK_SK,
        blockedUntil,
        ttl: ttlSeconds
      })
    }))
  }

  async getIpBlock (ip: string): Promise<{ blockedUntil: number } | null> {
    const pk = BLOCKED_IP_PREFIX + ip
    const response = await this.client.send(new GetItemCommand({
      TableName: this.tableName,
      Key: marshall({ code: pk, entityId: BLOCK_SK })
    }))
    const item = response.Item
    if (!item || item.blockedUntil?.N == null) return null
    return { blockedUntil: Number(item.blockedUntil.N) }
  }

  async setIpBlock (ip: string, blockedUntil: number): Promise<void> {
    const pk = BLOCKED_IP_PREFIX + ip
    const ttlSeconds = Math.floor(blockedUntil / 1000)
    await this.client.send(new PutItemCommand({
      TableName: this.tableName,
      Item: marshall({
        code: pk,
        entityId: BLOCK_SK,
        blockedUntil,
        ttl: ttlSeconds
      })
    }))
  }

  async getIpAttempts (ip: string): Promise<{ consecutiveNotFoundCount: number } | null> {
    const pk = IP_ATTEMPTS_PREFIX + ip
    const response = await this.client.send(new GetItemCommand({
      TableName: this.tableName,
      Key: marshall({ code: pk, entityId: ATTEMPTS_SK })
    }))
    const item = response.Item
    if (!item) return null
    return {
      consecutiveNotFoundCount: Number(item.consecutiveNotFoundCount?.N ?? 0)
    }
  }

  async incrementIpAttempts (ip: string): Promise<number> {
    const pk = IP_ATTEMPTS_PREFIX + ip
    const now = Date.now()
    const ttlSeconds = Math.floor(now / 1000) + 7200
    const response = await this.client.send(new UpdateItemCommand({
      TableName: this.tableName,
      Key: marshall({ code: pk, entityId: ATTEMPTS_SK }),
      UpdateExpression: 'SET consecutiveNotFoundCount = if_not_exists(consecutiveNotFoundCount, :zero) + :one, lastUpdated = :now, #ttl = :ttl',
      ExpressionAttributeNames: { '#ttl': 'ttl' },
      ExpressionAttributeValues: marshall({
        ':zero': 0,
        ':one': 1,
        ':now': now,
        ':ttl': ttlSeconds
      }),
      ReturnValues: 'UPDATED_NEW'
    }))
    const count = response.Attributes?.consecutiveNotFoundCount?.N
    return Number(count ?? 0)
  }

  async resetIpAttempts (ip: string): Promise<void> {
    const pk = IP_ATTEMPTS_PREFIX + ip
    await this.client.send(new DeleteItemCommand({
      TableName: this.tableName,
      Key: marshall({ code: pk, entityId: ATTEMPTS_SK })
    }))
  }

  /** Deletes all auth tokens belonging to an entity and returns the deleted count. */
  async deleteByEntityId (entityId: string): Promise<number> {
    const keysToDelete: Record<string, unknown>[] = []
    let lastEvaluatedKey: any

    do {
      const params: {
        TableName: string
        FilterExpression: string
        ExpressionAttributeValues: any
        ExclusiveStartKey?: any
      } = {
        TableName: this.tableName,
        FilterExpression: 'entityId = :entityId',
        ExpressionAttributeValues: marshall({
          ':entityId': entityId
        })
      }

      if (lastEvaluatedKey !== undefined) {
        params.ExclusiveStartKey = lastEvaluatedKey
      }

      const response = await this.client.send(new ScanCommand(params))

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

    return batchDeleteItems(this.client, this.tableName, keysToDelete)
  }
}
