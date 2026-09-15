import path from 'path'
import * as dotenv from 'dotenv'
import { DynamoDBClient, PutItemCommand, ScanCommand, GetItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall } from '@aws-sdk/util-dynamodb'
import { Entity } from 'domain/entities/Entity.entity'
import { EntityRepository } from '../../../../domain/repositories/Entity.repository'

dotenv.config({
  path: path.resolve(__dirname, '../../../../../.env')
})

export class DynamoDBEntityRepository implements EntityRepository {
  private readonly client = new DynamoDBClient({ region: 'us-east-1' })
  private readonly _environment: string = process.env.ENVIRONMENT || ''
  private readonly _project: string = process.env.PROJECT || ''
  private readonly _table: string = 'Entities'

  async save(entity: Entity): Promise<Entity> {
    const params = {
      TableName: `${this._project}-${this._environment}-${this._table}`,
      Item: marshall({
        id: entity.id ?? '',
        name: entity.name ?? '',
        entityTypeCode: entity.entityTypeCode ?? '',
        document: entity.document ?? '',
        dv: entity.dv ? Number(entity.dv) : 0,
        prefix: entity.prefix ?? undefined,
        signatories: entity.signatories ?? undefined,
        address: entity.address ?? undefined,
        email: entity.email ?? '',
        phone: entity.phone ?? undefined,
        apiKeyPlemsi: entity.apiKeyPlemsi ?? undefined,
        state: entity.state ?? '',
        resolution: entity.resolution ?? undefined,
        resolutionText: entity.resolutionText ?? undefined,
        resolutionDS: entity.resolutionDS ?? undefined,
        resolutionTextDS: entity.resolutionTextDS ?? undefined,
        lastElectronicBillNumber: entity.lastElectronicBillNumber ? Number(entity.lastElectronicBillNumber) : undefined,
        lastSupportDocumentNumber: entity.lastSupportDocumentNumber ? Number(entity.lastSupportDocumentNumber) : undefined,
        resolutionNC: entity.resolutionNC ?? undefined,
        resolutionTextNC: entity.resolutionTextNC ?? undefined,
        prefixNC: entity.prefixNC ?? undefined,
        lastCreditNumber: entity.lastCreditNumber ? Number(entity.lastCreditNumber) : undefined,
        resolutionNCDS: entity.resolutionNCDS ?? undefined,
        resolutionTextNCDS: entity.resolutionTextNCDS ?? undefined,
        prefixNCDS: entity.prefixNCDS ?? undefined,
        lastCreditSupportDocumentNumber: entity.lastCreditSupportDocumentNumber !== undefined
          ? Number(entity.lastCreditSupportDocumentNumber)
          : undefined,
        planExpiredAt: entity.planExpiredAt ?? undefined
      }, { removeUndefinedValues: true })
    }
    await this.client.send(new PutItemCommand(params))

    return entity
  }
  /*
  async getAll(): Promise<Entity[]> {
    const params = {
      TableName: `${this._project}-${this._environment}-Users`
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
  */
  async getById(id: string): Promise<Entity | null> {
    const params = {
      TableName: `${this._project}-${this._environment}-${this._table}`,
      Key: marshall({
        id
      }, {
        removeUndefinedValues: true
      })
    }
    const response = await this.client.send(new GetItemCommand(params))

    const item = (response.Item !== undefined) ? response.Item : null

    if (item === null) return null
    const entity = {
      id: item.id.S ?? '',
      name: item.name.S ?? '',
      entityTypeCode: item.entityTypeCode.S ?? '',
      document: item.document.S ?? '',
      dv: item.dv ? Number(item.dv.N) : 0,
      prefix: item.prefix ? item.prefix.S : undefined,
      address: item.address?.M !== undefined
        ?
          {
            description: item.address.M.description.S ?? '',
            city: item.address.M.city.M !== undefined 
              ?
                {
                  code: item.address.M.city.M.code.S ?? '',
                  description: item.address.M.city.M.description.S ?? ''
                }
              : { code: '', description: '' },
          }
        : undefined,
      email: item.email.S ?? '',
      phone: item.phone.S ?? '',
      apiKeyPlemsi: item.apiKeyPlemsi.S ?? undefined,
      state: item.state.S ?? '',
      signatories: item.signatories.L !== undefined
        ? item.signatories.L.map(signatory => {
          if (signatory.M !== undefined) {
            return {
              name: signatory.M.name.S ?? '',
              lastname: signatory.M.lastname.S ?? '',
              document: signatory.M.document.S ?? '',
              documentType: {
                code: signatory.M.documentType?.M?.code?.S ?? '',
                description: signatory.M.documentType?.M?.description?.S ?? '',
              }
            }
          } else {
            return {
              name: '',
              lastname: '',
              document: '',
              documentType: {
                code: '',
                description: ''
              }
            }
          }
        })
        : undefined,
      resolution: item.resolution?.S ?? undefined,
      resolutionText: item.resolutionText?.S ?? undefined,
      resolutionDS: item.resolutionDS?.S ?? undefined,
      resolutionTextDS: item.resolutionTextDS?.S ?? undefined,
      lastElectronicBillNumber: item.lastElectronicBillNumber?.N ? Number(item.lastElectronicBillNumber.N) : undefined,
      lastSupportDocumentNumber: item.lastSupportDocumentNumber?.N ? Number(item.lastSupportDocumentNumber.N) : undefined,
      resolutionNC: item.resolutionNC?.S ?? undefined,
      resolutionTextNC: item.resolutionTextNC?.S ?? undefined,
      prefixNC: item.prefixNC?.S ?? undefined,
      lastCreditNumber: item.lastCreditNumber?.N ? Number(item.lastCreditNumber.N) : undefined,
      resolutionNCDS: item.resolutionNCDS?.S ?? undefined,
      resolutionTextNCDS: item.resolutionTextNCDS?.S ?? undefined,
      prefixNCDS: item.prefixNCDS?.S ?? undefined,
      lastCreditSupportDocumentNumber: item.lastCreditSupportDocumentNumber?.N !== undefined
        ? Number(item.lastCreditSupportDocumentNumber.N)
        : undefined,
      planExpiredAt: item.planExpiredAt?.S ?? undefined
    }

    return entity
  }

  async getByDocument(document: string): Promise<Entity | null> {
    const params = {
      TableName: `${this._project}-${this._environment}-${this._table}`,
      FilterExpression: 'document = :document',
      ExpressionAttributeValues: marshall({
        ':document': document
      },
      {
        removeUndefinedValues: true
      })
    }
    const response = await this.client.send(new ScanCommand(params))

    const item = (response.Items !== undefined && response.Items.length > 0) ? response.Items[0] : null

    if (item === null) return null

    const entity = {
      id: item.id.S ?? '',
      name: item.name.S ?? '',
      entityTypeCode: item.entityTypeCode.S ?? '',
      document: item.document.S ?? '',
      dv: item.dv ? Number(item.dv.N) : 0,
      prefix: item.prefix ? item.prefix.S : undefined,
      address: item.address?.M !== undefined
        ?
          {
            description: item.address.M.description.S ?? '',
            city: item.address.M.city?.M !== undefined 
              ?
                {
                  code: item.address.M.city.M.code.S ?? '',
                  description: item.address.M.city.M.description.S ?? ''
                }
              : { code: '', description: '' },
          }
        : undefined,
      email: item.email.S ?? '',
      phone: item.phone.S ?? '',
      apiKeyPlemsi: item.apiKeyPlemsi.S ?? undefined,
      state: item.state.S ?? '',
      signatories: item.signatories.L !== undefined
        ? item.signatories.L.map(signatory => {
          if (signatory.M !== undefined) {
            return {
              name: signatory.M.name.S ?? '',
              lastname: signatory.M.lastname.S ?? '',
              document: signatory.M.document.S ?? '',
              documentType: {
                code: signatory.M.documentType?.M?.code?.S ?? '',
                description: signatory.M.documentType?.M?.description?.S ?? '',
              }
            }
          } else {
            return {
              name: '',
              lastname: '',
              document: '',
              documentType: {
                code: '',
                description: ''
              }
            }
          }
        })
        : undefined,
      resolution: item.resolution?.S ?? undefined,
      resolutionText: item.resolutionText?.S ?? undefined,
      resolutionDS: item.resolutionDS?.S ?? undefined,
      resolutionTextDS: item.resolutionTextDS?.S ?? undefined,
      lastElectronicBillNumber: item.lastElectronicBillNumber?.N ? Number(item.lastElectronicBillNumber.N) : undefined,
      lastSupportDocumentNumber: item.lastSupportDocumentNumber?.N ? Number(item.lastSupportDocumentNumber.N) : undefined,
      resolutionNC: item.resolutionNC?.S ?? undefined,
      resolutionTextNC: item.resolutionTextNC?.S ?? undefined,
      prefixNC: item.prefixNC?.S ?? undefined,
      lastCreditNumber: item.lastCreditNumber?.N ? Number(item.lastCreditNumber.N) : undefined,
      resolutionNCDS: item.resolutionNCDS?.S ?? undefined,
      resolutionTextNCDS: item.resolutionTextNCDS?.S ?? undefined,
      prefixNCDS: item.prefixNCDS?.S ?? undefined,
      lastCreditSupportDocumentNumber: item.lastCreditSupportDocumentNumber?.N !== undefined
        ? Number(item.lastCreditSupportDocumentNumber.N)
        : undefined,
      planExpiredAt: item.planExpiredAt?.S ?? undefined
    }

    return entity
  }
  
  async update(entity: Entity): Promise<Entity> {
    const params = {
      TableName: `${this._project}-${this._environment}-${this._table}`,
      Item: marshall({
        id: entity.id ?? '',
        name: entity.name ?? '',
        entityTypeCode: entity.entityTypeCode ?? '',
        document: entity.document ?? '',
        dv: entity.dv ? Number(entity.dv) : 0,
        prefix: entity.prefix ?? undefined,
        signatories: entity.signatories ?? undefined,
        address: entity.address ?? undefined,
        email: entity.email ?? '',
        phone: entity.phone ?? undefined,
        apiKeyPlemsi: entity.apiKeyPlemsi ?? undefined,
        state: entity.state ?? '',
        resolution: entity.resolution ?? undefined,
        resolutionText: entity.resolutionText ?? undefined,
        resolutionDS: entity.resolutionDS ?? undefined,
        resolutionTextDS: entity.resolutionTextDS ?? undefined,
        lastElectronicBillNumber: entity.lastElectronicBillNumber ? Number(entity.lastElectronicBillNumber) : undefined,
        lastSupportDocumentNumber: entity.lastSupportDocumentNumber ? Number(entity.lastSupportDocumentNumber) : undefined,
        resolutionNC: entity.resolutionNC ?? undefined,
        resolutionTextNC: entity.resolutionTextNC ?? undefined,
        prefixNC: entity.prefixNC ?? undefined,
        lastCreditNumber: entity.lastCreditNumber ? Number(entity.lastCreditNumber) : undefined,
        resolutionNCDS: entity.resolutionNCDS ?? undefined,
        resolutionTextNCDS: entity.resolutionTextNCDS ?? undefined,
        prefixNCDS: entity.prefixNCDS ?? undefined,
        lastCreditSupportDocumentNumber: entity.lastCreditSupportDocumentNumber !== undefined
          ? Number(entity.lastCreditSupportDocumentNumber)
          : undefined,
        planExpiredAt: entity.planExpiredAt ?? undefined
      })
    }
    await this.client.send(new PutItemCommand(params))

    return entity
  }

  /** Deletes an entity by id. */
  async delete (id: string): Promise<void> {
    const params = {
      TableName: `${this._project}-${this._environment}-${this._table}`,
      Key: marshall({
        id
      })
    }
    await this.client.send(new DeleteItemCommand(params))
  }
}
