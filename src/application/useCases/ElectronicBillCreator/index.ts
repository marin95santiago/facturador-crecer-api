import path from 'path'
import * as dotenv from 'dotenv'
import { ElectronicBillRepository } from '../../../domain/repositories/ElectronicBill.repository'
import { EntityRepository } from '../../../domain/repositories/Entity.repository'
import { SubscriptionRepository } from '../../../domain/repositories/Subscription.repository'
import { ElectronicBill } from '../../../domain/entities/ElectronicBill.entity'
import { BillPlemsiService } from '../../../domain/services/electronicBill/BillPlemsi.service'
import { GetEntityByIdService } from '../../../domain/services/entity/GetEntityById.service'
import { RecordSubscriptionDocumentService } from '../../../domain/services/subscription/RecordSubscriptionDocument.service'
import { UnhandledException } from '../../../domain/exceptions/common/Unhandled.exception'
import { electronicBillPlemsiMapper } from '../../../domain/mappers/ElectronicBill/electronicBill.mapper'

dotenv.config({
  path: path.resolve(__dirname, '../../../../.env')
})

const PLEMSI_ERROR_BILL_STILL_PENDING_EMIT_CODE = process.env.PLEMSI_ERROR_BILL_STILL_PENDING_EMIT_CODE || ''

export class ElectronicBillCreatorUseCase {
  private readonly _electronicBillRepository: ElectronicBillRepository
  private readonly _entityRepository: EntityRepository
  private readonly _billPlemsiService: BillPlemsiService
  private readonly _getEntityByIdService: GetEntityByIdService
  private readonly _recordSubscriptionDocumentService: RecordSubscriptionDocumentService

  constructor (electronicBillRepository: ElectronicBillRepository, entityRepository: EntityRepository, subscriptionRepository: SubscriptionRepository) {
    this._electronicBillRepository = electronicBillRepository
    this._entityRepository = entityRepository
    this._billPlemsiService = new BillPlemsiService()
    this._getEntityByIdService = new GetEntityByIdService(entityRepository)
    this._recordSubscriptionDocumentService = new RecordSubscriptionDocumentService(subscriptionRepository)
  }

  /** Creates an electronic bill in Plemsi and stores it when the emission is accepted. */
  async run (bill: ElectronicBill): Promise<{ data: ElectronicBill, entityInformation: { apikey: string, number: number }}> {
    try {
      const entity = await this._getEntityByIdService.run(bill.entityId || '')
      if (entity) {
        const number = entity.lastElectronicBillNumber ? Number(entity.lastElectronicBillNumber + 1) : 0
        bill.number = number
        const dataPlemsi = electronicBillPlemsiMapper(bill, {
          resolution: entity.resolution ?? '',
          resolutionText: entity.resolutionText ?? '',
          prefix: entity.prefix ?? undefined
        })

        // Validate and create bill on DIAN
        const billPlemsi = await this._billPlemsiService.run(dataPlemsi, entity.apiKeyPlemsi ?? '')


        if (billPlemsi.data.success || billPlemsi.data.errCode === PLEMSI_ERROR_BILL_STILL_PENDING_EMIT_CODE) {
          //get url preview
          let url = undefined

          if (billPlemsi.data.success) {
            const regex = /(https?:\/\/[^\s]+)/g
            const matches = billPlemsi.data.data.QRCode.match(regex)
            url = matches ? matches[0] : undefined
          }

          await Promise.all([
            this._electronicBillRepository.save({...bill, preview: url}),
            this._entityRepository.update({
              ...entity,
              lastElectronicBillNumber: number
            })
          ])

          try {
            await this._recordSubscriptionDocumentService.run(entity.id)
          } catch (error) {
            console.error('Failed to record subscription document', { entityId: entity.id, error })
          }

          return { data: bill, entityInformation: { apikey: entity.apiKeyPlemsi ?? '', number: number }}
        } else {
          throw 'Error al crear la factura ante la DIAN'
        }
      } else {
        throw 'No se encontró la entidad'
      }
  
    } catch (error) {
      throw new UnhandledException(`Facturador, error: ${error}`)
    }
  }
}
