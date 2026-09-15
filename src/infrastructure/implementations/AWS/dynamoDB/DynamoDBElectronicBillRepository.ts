import path from 'path'
import * as dotenv from 'dotenv'
import { DynamoDBClient, PutItemCommand, QueryCommand, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall } from '@aws-sdk/util-dynamodb'
import { ElectronicBill } from '../../../../domain/entities/ElectronicBill.entity'
import { ElectronicBillRepository } from '../../../../domain/repositories/ElectronicBill.repository'
import { batchDeleteItems } from './batchDeleteItems'

dotenv.config({
  path: path.resolve(__dirname, '../../../../../.env')
})

export class DynamoDBElectronicBillRepository implements ElectronicBillRepository {
  private readonly client = new DynamoDBClient({ region: 'us-east-1' })
  private readonly _environment: string = process.env.ENVIRONMENT || ''
  private readonly _project: string = process.env.PROJECT || ''
  private readonly _table: string = 'ElectronicBills'

  async save(bill: ElectronicBill): Promise<ElectronicBill> {
    const params = {
      TableName: `${this._project}-${this._environment}-${this._table}`,
      Item: marshall({
        entityId: bill.entityId ?? '',
        userId: bill.userId ?? '',
        number: Number(bill.number) ?? 0,
        preview: bill.preview ?? undefined,
        date: bill.date ?? '',
        orderReference: bill.orderReference ?? undefined,
        third: bill.third ?? undefined,
        wayToPay: bill.wayToPay ?? undefined,
        paymentMethod: bill.paymentMethod ?? undefined,
        paymentDueDate: bill.paymentDueDate ?? undefined,
        items: bill.items ?? undefined,
        note: bill.note ?? '',
        taxes: bill.taxes ?? undefined,
        total: bill.total ?? 0,
        totalTaxes: bill.totalTaxes ?? 0,
        totalToPay: bill.totalToPay ?? 0
      }, {
        removeUndefinedValues: true
      })
    }
    await this.client.send(new PutItemCommand(params))

    return bill
  }

  async getByNumber(entityId: string, number: number): Promise<ElectronicBill | null> {
    const params = {
      TableName: `${this._project}-${this._environment}-${this._table}`,
      Key: marshall({
        number,
        entityId
      })
    }

    const response = await this.client.send(new GetItemCommand(params))

    const item = (response.Item !== undefined) ? response.Item : null

    if (item === null) return null

    const bill = {
      entityId: item.entityId.S ?? undefined,
      userId: item.userId.S ?? undefined,
      number: Number(item.number.N) ?? undefined,
      preview: item.preview?.S ?? undefined,
      date: item.date.S ?? '',
      orderReference: item.orderReference.S ?? '',
      third: item.third.M !== undefined ? 
      (
        {
          entityId: item.third.M.entityId.S ?? '',
          document: item.third.M.document.S ?? '',
          dv: item.third.M.dv.S ?? undefined,
          documentType: item.third.M.documentType.M !== undefined
            ?
            {
              code: item.third.M.documentType.M.code.S ?? '',
              description: item.third.M.documentType.M.description.S ?? ''
            }
            : { code: '', description: '' },
          organizationType: item.third.M.organizationType.M !== undefined
            ?
            {
              code: item.third.M.organizationType.M.code.S ?? '',
              description: item.third.M.organizationType.M.description.S ?? ''
            }
            : { code: '', description: '' },
          liabilityType: item.third.M.liabilityType.M !== undefined
            ?
            {
              code: item.third.M.liabilityType.M.code.S ?? '',
              description: item.third.M.liabilityType.M.description.S ?? ''
            }
            : { code: '', description: '' },
          regimeType: item.third.M.regimeType.M !== undefined
            ?
            {
              code: item.third.M.regimeType.M.code.S ?? '',
              description: item.third.M.regimeType.M.description.S ?? ''
            }
            : { code: '', description: '' },
          name: item.third.M.name?.S ?? undefined,
          lastname: item.third.M.lastname?.S ?? undefined,
          businessName: item.third.M.businessName?.S ?? undefined,
          phone: item.third.M.phone?.S ?? '',
          address: item.third.M.address?.S ?? '',
          city: item.third.M.city?.M !== undefined
            ?
            {
              code: item.third.M.city.M.code.S ?? '',
              description: item.third.M.city.M.description.S ?? ''
            }
            : undefined,
          email: item.third.M.email.S ?? ''
        }
      ) : 
      (
        {
          entityId: '',
          document: '',
          documentType: {
            code: '',
            description: '',
          },
          organizationType: {
            code: '',
            description: '',
          },
          liabilityType: {
            code: '',
            description: '',
          },
          regimeType: {
            code: '',
            description: '',
          },
          phone: '',
          address: '',
          email: '',
        }
      ),
      wayToPay: item.wayToPay.M !== undefined ?
      (
        {
          code: item.wayToPay.M.code.S ?? '',
          description: item.wayToPay.M.description.S ?? ''
        }
      ) : ({ code: '', description: '' }),
      paymentMethod: item.paymentMethod?.M !== undefined ?
      ( 
        {
          code: item.paymentMethod?.M.code.S ?? '',
          description: item.paymentMethod?.M.description.S ?? ''
        }
      ): ({ code: '', description: '' }),
      paymentDueDate: item.paymentDueDate?.S ?? '',
      municipality: item.third.M?.city?.M !== undefined
        ?
          {
            code: item.third.M.city.M.code.S ?? '',
            description: item.third.M.city.M.description.S ?? ''
          }
        : { code: '', description: '' },
      note: item.note.S ?? '',
      items: item.items.L !== undefined ?
      ( 
        item.items.L.map((itemBill: any) => {
          return {
            code: itemBill.M.code.S ?? '',
            description: itemBill.M.description.S ?? '',
            price: Number(itemBill.M.price.N ?? itemBill.M.price.S) ?? 0,
            quantity: Number(itemBill.M.quantity.S ? itemBill.M.quantity.S : itemBill.M.quantity.N) ?? 0,
            total: Number(itemBill.M.total.N) ?? 0,
            taxes: itemBill.M.taxes.L.map((tax: any) => {
              return {
                code: tax.M.code.S ?? '',
                description: tax.M.description.S ?? '',
                percent: Number(tax.M.percent.N) ?? 0,
                taxAmount: Number(tax.M.taxAmount.N) ?? 0,
                taxableAmount: Number(tax.M.taxableAmount.N) ?? 0
              }
            }),
            unitMeasure: itemBill.M.unitMeasure.M !== undefined
              ?
              {
                code: itemBill.M.unitMeasure.M.code.N ? itemBill.M.unitMeasure.M.code.N : itemBill.M.unitMeasure.M.code.S,
                description: itemBill.M.unitMeasure.M.description.S ?? ''
              }
              : undefined,
            itemType: itemBill.M.itemType.M !== undefined
              ?
              {
                code: itemBill.M.itemType.M.code.N ? itemBill.M.itemType.M.code.N : itemBill.M.itemType.M.code.S,
                description: itemBill.M.itemType.M.description.S ?? ''
              }
              : {code: '', description: ''},
          }
        })
      ) : ([
        {
          itemType: {
            code: '',
            description: ''
          },
          price: 0,
          quantity: 0,
          total: 0,
          taxes: [ 
            {
              code: '',
              description: '',
              percent: 0,
              taxAmount: 0,
              taxableAmount: 0
            }
          ]
        }
      ]),
      taxes: item.taxes !== undefined
      ?
        ( 
          item.taxes.L !== undefined ?
          (
            item.taxes.L.map((tax: any) => {
              return {
                code: tax.M.code.S ?? '',
                description: tax.M.description.S ?? '',
                percent: Number(tax.M.percent.N) ?? 0,
                taxAmount: Number(tax.M.taxAmount.N) ?? 0,
                taxableAmount: Number(tax.M.taxableAmount.N) ?? 0
              }
            })
          ) : [
            {
              code: '',
              description: '',
              percent: 0,
              taxAmount: 0,
              taxableAmount: 0
            }
          ]
        )
      : // lastest bills
        (
          item.allTaxTotals.L !== undefined ?
          (
            item.allTaxTotals.L.map((tax: any) => {
              return {
                code: tax.M.code.S ?? '',
                description: tax.M.description.S ?? '',
                percent: Number(tax.M.percent.N) ?? 0,
                taxAmount: Number(tax.M.taxAmount.N) ?? 0,
                taxableAmount: Number(tax.M.taxableAmount.N) ?? 0
              }
            })
          ) : [
            {
              code: '',
              description: '',
              percent: 0,
              taxAmount: 0,
              taxableAmount: 0
            }
          ]
        ),
      total: Number(item.total.N) ?? 0,
      totalTaxes: Number(item.totalTaxes.N) ?? 0,
      totalToPay: Number(item.totalToPay.N) ?? 0
    }

    return bill
  }

  async getAll(entityId: string, limit?: number, lastEvaluatedKey?: any): Promise<{ lastEvaluatedKey: any, bills: ElectronicBill[] }> {
    const params: {
      TableName: string
      IndexName: string
      KeyConditionExpression: string
      ExpressionAttributeValues: any
      ScanIndexForward: boolean
      ExclusiveStartKey?: any
      Limit?: number
    } = {
      TableName: `${this._project}-${this._environment}-${this._table}`,
      IndexName: 'entityId-number-index',
      KeyConditionExpression: 'entityId = :entityId',
      ExpressionAttributeValues: {
        ':entityId': {
          S: entityId
        }
      },
      ScanIndexForward: false
    }

    if (limit !== undefined) {
      params.Limit = limit
    }

    if (lastEvaluatedKey !== undefined) {
      params.ExclusiveStartKey = lastEvaluatedKey
    }
    const response = await this.client.send(new QueryCommand(params))

    const items = (response.Items !== undefined) ? response.Items : []

    const bills = items.map((item: any) => {
      return {
        entityId: item.entityId.S ?? undefined,
        userId: item.userId.S ?? undefined,
        number: item.number.N ?? undefined,
        preview: item.preview?.S ?? undefined,
        date: item.date.S ?? '',
        orderReference: item.orderReference.S ?? '',
        third: {
          entityId: item.third.M.entityId.S ?? '',
          document: item.third.M.document.S ?? '',
          dv: item.third.M.dv.S ?? undefined,
          documentType: item.third.M.documentType.M !== undefined
            ?
            {
              code: item.third.M.documentType.M.code.S ?? '',
              description: item.third.M.documentType.M.description.S ?? ''
            }
            : { code: '', description: '' },
          organizationType: item.third.M.organizationType.M !== undefined
            ?
            {
              code: item.third.M.organizationType.M.code.S ?? '',
              description: item.third.M.organizationType.M.description.S ?? ''
            }
            : { code: '', description: '' },
          liabilityType: item.third.M.liabilityType.M !== undefined
            ?
            {
              code: item.third.M.liabilityType.M.code.S ?? '',
              description: item.third.M.liabilityType.M.description.S ?? ''
            }
            : { code: '', description: '' },
          regimeType: item.third.M.regimeType.M !== undefined
            ?
            {
              code: item.third.M.regimeType.M.code.S ?? '',
              description: item.third.M.regimeType.M.description.S ?? ''
            }
            : { code: '', description: '' },
          name: item.third.M.name?.S ?? undefined,
          lastname: item.third.M.lastname?.S ?? undefined,
          businessName: item.third.M.businessName?.S ?? undefined,
          phone: item.third.M.phone?.S ?? '',
          address: item.third.M.address?.S ?? '',
          city: item.third.M.city?.M !== undefined
            ?
            {
              code: item.third.M.city.M.code.S ?? '',
              description: item.third.M.city.M.description.S ?? ''
            }
            : undefined,
          email: item.third.M.email.S ?? ''
        },
        wayToPay: {
          code: item.wayToPay.M.code.S ?? '',
          description: item.wayToPay.M.description.S ?? ''
        },
        paymentMethod: item.paymentMethod !== undefined ?
        (
          {
            code: item.paymentMethod.M.code.S ?? '',
            description: item.paymentMethod.M.description.S ?? ''
          }
        ) : { code: '', description: '' },
        paymentDueDate: item.paymentDueDate !== undefined ? item.paymentDueDate.S : '',
        municipality: item.third.M.city?.M !== undefined
          ?
            {
              code: item.third.M.city.M.code.S ?? '',
              description: item.third.M.city.M.description.S ?? ''
            }
          : { code: '', description: '' },
        note: item.note.S ?? '',
        items: item.items.L.map((itemBill: any) => {
          return {
            code: itemBill.M.code.S ?? '',
            description: itemBill.M.description.S ?? '',
            price: Number(itemBill.M.price.N ?? itemBill.M.price.S) ?? 0,
            unitMeasure: itemBill.M.unitMeasure.M !== undefined
              ?
              {
                code: itemBill.M.unitMeasure.M.code.N ?? '',
                description: itemBill.M.unitMeasure.M.description.S ?? ''
              }
              : undefined,
            itemType: itemBill.M.itemType.M !== undefined
              ?
              {
                code: itemBill.M.itemType.M.code.N ? itemBill.M.itemType.M.code.N : Number(itemBill.M.itemType.M.code.S),
                description: itemBill.M.itemType.M.description.S ?? ''
              }
              : undefined,
            taxes: itemBill.M.taxes.L.map((tax: any) => {
              return {
                code: tax.M.code.S ?? '',
                description: tax.M.description.S ?? '',
                percent: Number(tax.M.percent.N) ?? 0,
                taxAmount: Number(tax.M.taxAmount.N) ?? 0,
                taxableAmount: Number(tax.M.taxableAmount.N) ?? 0
              }
            })
          }
        }),
        taxes: item.taxes !== undefined
        ?
          (
            item.taxes.L.map((tax: any) => {
              if (tax !== undefined) {
                return {
                  code: tax.M.code.S ?? '',
                  description: tax.M.description.S ?? '',
                  percent: Number(tax.M.percent.N) ?? 0,
                  taxAmount: Number(tax.M.taxAmount.N) ?? 0,
                  taxableAmount: Number(tax.M.taxableAmount.N) ?? 0
                }
              }
            })
          )
        : // lastest bills
          (
            item.allTaxTotals.L.map((tax: any) => {
            if (tax !== undefined) {
              return {
                code: tax.M.code.S ?? '',
                description: tax.M.description.S ?? '',
                percent: Number(tax.M.percent.N) ?? 0,
                taxAmount: Number(tax.M.taxAmount.N) ?? 0,
                taxableAmount: Number(tax.M.taxableAmount.N) ?? 0
              }
            }
          })
          ),
        total: item.total.N ?? 0,
        totalTaxes: item.totalTaxes.N ?? 0,
        totalToPay: item.totalToPay.N ?? 0
      }
    })

    return {
      lastEvaluatedKey: response.LastEvaluatedKey,
      bills: bills
    }
  }

  /** Deletes all electronic bills belonging to an entity and returns the deleted count. */
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
        IndexName: 'entityId-number-index',
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
        if (item.number?.N !== undefined && item.entityId?.S !== undefined) {
          keysToDelete.push({
            number: Number(item.number.N),
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
