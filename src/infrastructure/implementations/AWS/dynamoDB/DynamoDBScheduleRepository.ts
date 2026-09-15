import path from 'path'
import * as dotenv from 'dotenv'
import { DeleteItemCommand, DynamoDBClient, PutItemCommand, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb'
import { marshall } from '@aws-sdk/util-dynamodb'
import { ScheduleRepository } from '../../../../domain/repositories/Schedule.repository'
import { Schedule } from '../../../../domain/entities/Schedule.entity'
import { batchDeleteItems } from './batchDeleteItems'

dotenv.config({
  path: path.resolve(__dirname, '../../../../../.env')
})

const ENVIRONMENT = process.env.ENVIRONMENT || ''
const PROJECT = process.env.PROJECT || ''

export class DynamoDBScheduleRepository implements ScheduleRepository {
  private readonly client = new DynamoDBClient({ region: 'us-east-1' })
  private readonly _environment: string
  private readonly _project: string
  private readonly _table: string

  constructor() {
    this._environment = ENVIRONMENT
    this._project = PROJECT
    this._table = 'Schedules'
  }

  async save(schedule: Schedule): Promise<Schedule> {
    try {
      const params = {
        TableName: `${this._project}-${this._environment}-${this._table}`,
        Item: marshall({
          entityId: schedule.entityId ?? '',
          userId: schedule.userId ?? '',
          code: schedule.code ?? '',
          name: schedule.name ?? '',
          startDate: schedule.startDate ?? '',
          endDate: schedule.endDate ?? null,
          intervalDays: schedule.intervalDays ?? '',
          entity: schedule.entity ?? '',
          idForm: schedule.idForm ?? ''
        })
      }

      await this.client.send(new PutItemCommand(params))

      return schedule
    } catch (error) {
      throw error
    }
  }

  async getByEntity(entityId: string, entity: string, limit?: number, lastEvaluatedKey?: any): Promise<{lastEvaluatedKey: any, schedules: Schedule[]}> {
    const params : {
      TableName: string
      IndexName: string
      KeyConditionExpression: string
      ExpressionAttributeValues: any
      ExclusiveStartKey?: any
      Limit?: number
    } = {
      TableName: `${this._project}-${this._environment}-${this._table}`,
      IndexName: 'entityId-entity-index',
      KeyConditionExpression: 'entityId = :entityId AND entity = :entity',
      ExpressionAttributeValues: {
        ':entityId': {
          S: entityId
        },
        ':entity': {
          S: entity
        }
      }
    }

    if (limit !== undefined) {
      params.Limit = limit
    }

    if (lastEvaluatedKey !== undefined) {
      params.ExclusiveStartKey = lastEvaluatedKey
    }

    try {
      const response = await this.client.send(new QueryCommand(params))

      const items = (response.Items !== undefined) ? response.Items : []

      const schedules = items.map((item: any) => {
        return {
          entityId: item.entityId.S ?? '',
          userId: item.userId.S ?? '',
          code: item.code.S ?? '',
          name: item.name.S ?? '',
          startDate: item.startDate.S ?? '',
          endDate: item.endDate.S ?? undefined,
          intervalDays: item.intervalDays.S ?? '',
          entity: item.entity.S ?? '',
          idForm: item.idForm.S ?? ''
        }
      })

      return {
        lastEvaluatedKey: response.LastEvaluatedKey,
        schedules: schedules
      }
    } catch (error) {
      throw error
    }
  }

  async getAll(): Promise<Schedule[]> {
    try {
      const params : {
        TableName: string
      } = {
        TableName: `${this._project}-${this._environment}-${this._table}`,
      }
  
      const response = await this.client.send(new ScanCommand(params))
  
      const items = (response.Items !== undefined) ? response.Items : []
  
      const schedules = items.map((item: any) => {
        return {
          entityId: item.entityId.S ?? '',
          userId: item.userId.S ?? '',
          code: item.code.S ?? '',
          name: item.name.S ?? '',
          startDate: item.startDate.S ?? '',
          endDate: item.endDate.S ?? undefined,
          intervalDays: item.intervalDays.S ?? '',
          entity: item.entity.S ?? '',
          idForm: item.idForm.S ?? ''
        }
      })
  
      return schedules
    } catch (error) {
      throw error
    }
  }

  async delete(entityId: string, code: string): Promise<{ message: string }> {
    try {
      const params = {
        TableName: `${this._project}-${this._environment}-${this._table}`,
        Key: {
          code: { 
            S: code
          },
          entityId: {
            S: entityId
          }
        }
      }
      await this.client.send(new DeleteItemCommand(params))
  
      return { message: `Item with code ${code} deleted successfully` };
    } catch (error) {
      throw error
    }
  }

  /** Deletes all schedules belonging to an entity and returns the deleted count. */
  async deleteByEntityId (entityId: string): Promise<number> {
    const tableName = `${this._project}-${this._environment}-${this._table}`
    const keysToDelete: Record<string, unknown>[] = []
    let lastEvaluatedKey: any

    do {
      const params: {
        TableName: string
        FilterExpression: string
        ExpressionAttributeValues: any
        ExclusiveStartKey?: any
      } = {
        TableName: tableName,
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

    return batchDeleteItems(this.client, tableName, keysToDelete)
  }
}
