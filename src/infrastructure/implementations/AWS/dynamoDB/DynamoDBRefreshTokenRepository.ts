import path from 'path'
import * as dotenv from 'dotenv'
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
  TransactWriteItem,
  TransactWriteItemsCommand,
  TransactionCanceledException,
  UpdateItemCommand
} from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import {
  NewRefreshTokenRow,
  RefreshTokenRecord,
  RefreshTokenRepository,
  RotateRefreshTokenOutcome
} from '../../../../domain/repositories/RefreshToken.repository'

dotenv.config({
  path: path.resolve(__dirname, '../../../../../.env')
})

const ENVIRONMENT = process.env.ENVIRONMENT ?? ''
const PROJECT = process.env.PROJECT ?? ''
const FAMILY_ID_INDEX = 'familyId-index'

function mapItemToRecord (item: Record<string, unknown>): RefreshTokenRecord {
  const record: RefreshTokenRecord = {
    tokenHash: String(item.tokenHash ?? ''),
    familyId: String(item.familyId ?? ''),
    userId: String(item.userId ?? ''),
    expiresAt: Number(item.expiresAt ?? 0),
    createdAt: Number(item.createdAt ?? 0),
    ttl: Number(item.ttl ?? 0)
  }

  if (item.revokedAt !== undefined && item.revokedAt !== null) {
    record.revokedAt = Number(item.revokedAt)
  }

  return record
}

function rowToItem (row: NewRefreshTokenRow): Record<string, unknown> {
  return {
    tokenHash: row.tokenHash,
    familyId: row.familyId,
    userId: row.userId,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    ttl: row.ttl
  }
}

export class DynamoDBRefreshTokenRepository implements RefreshTokenRepository {
  private readonly client = new DynamoDBClient({ region: 'us-east-1' })
  private readonly tableName = `${PROJECT}-${ENVIRONMENT}-RefreshTokens`

  /** Persists a new refresh token row for a fresh login session. */
  async saveNew (row: NewRefreshTokenRow): Promise<void> {
    await this.client.send(new PutItemCommand({
      TableName: this.tableName,
      Item: marshall(rowToItem(row), { removeUndefinedValues: true })
    }))
  }

  /** Loads a refresh token row by its SHA-256 hash. */
  async findByHash (tokenHash: string): Promise<RefreshTokenRecord | null> {
    const response = await this.client.send(new GetItemCommand({
      TableName: this.tableName,
      Key: marshall({ tokenHash })
    }))

    if (response.Item === undefined) {
      return null
    }

    return mapItemToRecord(unmarshall(response.Item))
  }

  /** Sets revokedAt on one row if it is still active. */
  async revokeByHashIfActive (tokenHash: string, revokedAt: number): Promise<void> {
    try {
      await this.client.send(new UpdateItemCommand({
        TableName: this.tableName,
        Key: marshall({ tokenHash }),
        UpdateExpression: 'SET revokedAt = :revokedAt',
        ConditionExpression: 'attribute_not_exists(revokedAt)',
        ExpressionAttributeValues: marshall({
          ':revokedAt': revokedAt
        })
      }))
    } catch (error) {
      if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
        return
      }
      throw error
    }
  }

  /** Revokes every active row in a rotation family. */
  async revokeAllActiveInFamily (familyId: string, revokedAt: number): Promise<void> {
    let exclusiveStartKey: Record<string, unknown> | undefined

    do {
      const response = await this.client.send(new QueryCommand({
        TableName: this.tableName,
        IndexName: FAMILY_ID_INDEX,
        KeyConditionExpression: 'familyId = :familyId',
        FilterExpression: 'attribute_not_exists(revokedAt)',
        ExpressionAttributeValues: marshall({
          ':familyId': familyId
        }),
        ExclusiveStartKey: exclusiveStartKey !== undefined
          ? marshall(exclusiveStartKey) as Record<string, import('@aws-sdk/client-dynamodb').AttributeValue>
          : undefined
      }))

      const items = response.Items ?? []
      for (const item of items) {
        const row = mapItemToRecord(unmarshall(item))
        await this.revokeByHashIfActive(row.tokenHash, revokedAt)
      }

      if (response.LastEvaluatedKey !== undefined) {
        exclusiveStartKey = unmarshall(response.LastEvaluatedKey)
      } else {
        exclusiveStartKey = undefined
      }
    } while (exclusiveStartKey !== undefined)
  }

  /** Atomically revokes the presented token and inserts the successor row. */
  async rotateToken (
    presentedTokenHash: string,
    successorRow: NewRefreshTokenRow,
    revokedAt: number
  ): Promise<RotateRefreshTokenOutcome> {
    const transactItems: TransactWriteItem[] = [
      {
        Update: {
          TableName: this.tableName,
          Key: marshall({ tokenHash: presentedTokenHash }),
          UpdateExpression: 'SET revokedAt = :revokedAt',
          ConditionExpression: 'attribute_not_exists(revokedAt)',
          ExpressionAttributeValues: marshall({
            ':revokedAt': revokedAt
          })
        }
      },
      {
        Put: {
          TableName: this.tableName,
          Item: marshall(rowToItem(successorRow), { removeUndefinedValues: true }),
          ConditionExpression: 'attribute_not_exists(tokenHash)'
        }
      }
    ]

    try {
      await this.client.send(new TransactWriteItemsCommand({
        TransactItems: transactItems
      }))
      return 'rotated'
    } catch (error) {
      if (error instanceof TransactionCanceledException) {
        return 'already_revoked'
      }
      console.error('Failed to rotate refresh token', { presentedTokenHash, error })
      return 'failed'
    }
  }
}
