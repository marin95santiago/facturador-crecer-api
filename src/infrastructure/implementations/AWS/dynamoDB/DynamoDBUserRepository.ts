import path from 'path'
import * as dotenv from 'dotenv'
import { DynamoDBClient, PutItemCommand, ScanCommand, GetItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall } from '@aws-sdk/util-dynamodb'
import { User } from '../../../../domain/entities/User.entity'
import { UserRepository } from '../../../../domain/repositories/User.repository'
import { batchDeleteItems } from './batchDeleteItems'

dotenv.config({
  path: path.resolve(__dirname, '../../../../../.env')
})

const ENVIRONMENT = process.env.ENVIRONMENT || ''
const PROJECT = process.env.PROJECT || ''

export class DynamoDBUserRepository implements UserRepository {
  private readonly client = new DynamoDBClient({ region: 'us-east-1' })
  private readonly _environment: string
  private readonly _project: string
  private readonly _table: string

  constructor () {
    this._environment = ENVIRONMENT
    this._project = PROJECT
    this._table = 'Users'
  }

  async save(user: User): Promise<User> {
    const params = {
      TableName: `${this._project}-${this._environment}-${this._table}`,
      Item: marshall({
        id: user.id ?? '',
        email: user.email ?? '',
        password: user.password ?? '',
        name: user.name ?? '',
        lastname: user.lastname ?? '',
        entityId: user.entityId ?? '',
        state: user.state ?? '',
        permissions: user.permissions ?? ['']
      })
    }
    await this.client.send(new PutItemCommand(params))

    return user
  }

  async getAll(): Promise<User[]> {
    const params = {
      TableName: `${this._project}-${this._environment}-${this._table}`
    }
    const response = await this.client.send(new ScanCommand(params))

    const items = (response.Items !== undefined) ? response.Items : []

    const users = items.map((item: any) => {
      return {
        id: item.id.S ?? '',
        email: item.email.S ?? '',
        name: item.name.S ?? '',
        lastname: item.lastname.S ?? '',
        entityId: item.entityId.S ?? '',
        state: item.state.S ?? '',      
        permissions: item.permissions.L !== undefined
          ? item.permissions.L.map((permission: { S: string | undefined }) => {
            if (permission.S !== undefined) {
              return permission.S
            } else {
              return ''
            }
          })
          : ['']
      }
    })

    return users
  }

  async getById(id: string): Promise<User | null> {
    const params = {
      TableName: `${this._project}-${this._environment}-${this._table}`,
      Key: marshall({
        id
      })
    }
    const response = await this.client.send(new GetItemCommand(params))

    const item = (response.Item !== undefined) ? response.Item : null

    if (item === null) return null
  
    const user = {
      id: item.id.S ?? '',
      email: item.email.S ?? '',
      name: item.name.S ?? '',
      lastname: item.lastname.S ?? '',
      entityId: item.entityId.S ?? '',
      state: item.state.S ?? '',
      permissions: item.permissions.L !== undefined
        ? item.permissions.L.map(permission => {
          if (permission.S !== undefined) {
            return permission.S
          } else {
            return ''
          }
        })
        : ['']
    }

    return user
  }

  async getByEmail(email: string): Promise<User | null> {
    const params = {
      TableName: `${this._project}-${this._environment}-${this._table}`,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: marshall({
        ':email': email
      })
    }
    const response = await this.client.send(new ScanCommand(params))

    const item = (response.Items !== undefined && response.Items.length > 0) ? response.Items[0] : null

    if (item === null) return null

    const user = {
      id: item.id.S ?? '',
      email: item.email.S ?? '',
      password: item.password.S ?? '',
      name: item.name.S ?? '',
      lastname: item.lastname.S ?? '',
      entityId: item.entityId.S ?? '',
      state: item.state.S ?? '',
      permissions: item.permissions.L !== undefined
        ? item.permissions.L.map(permission => {
          if (permission.S !== undefined) {
            return permission.S
          } else {
            return ''
          }
        })
        : ['']
    }
    return user
  }

  async update(user: User): Promise<User> {
    const params = {
      TableName: `${this._project}-${this._environment}-${this._table}`,
      Item: marshall({
        id: user.id,
        email: user.email,
        password: user.password,
        name: user.name,
        lastname: user.lastname,
        entityId: user.entityId,
        state: user.state,
        permissions: user.permissions
      },
        {
          removeUndefinedValues: true
        })
    }
    await this.client.send(new PutItemCommand(params))

    return user
  }

  async delete(id: string): Promise<void> {
    const params = {
      TableName: `${this._project}-${this._environment}-${this._table}`,
      Key: marshall({
        id
      })
    }
    await this.client.send(new DeleteItemCommand(params))
  }

  /** Deletes all users belonging to an entity and returns the deleted count. */
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
        if (item.id?.S !== undefined) {
          keysToDelete.push({ id: item.id.S })
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
