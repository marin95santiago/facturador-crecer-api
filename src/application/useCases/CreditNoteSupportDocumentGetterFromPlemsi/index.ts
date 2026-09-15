import path from 'path'
import * as dotenv from 'dotenv'
import { EntityRepository } from '../../../domain/repositories/Entity.repository'
import { GetEntityByIdService } from '../../../domain/services/entity/GetEntityById.service'
import { UnhandledException } from '../../../domain/exceptions/common/Unhandled.exception'
import { GetCreditNoteSupportDocumentPlemsiService } from '../../../domain/services/supportDocument/getCreditNoteSupportDocumentPlemsiList'

dotenv.config({
  path: path.resolve(__dirname, '../../../../.env')
})

/** Loads support-document credit notes from Plemsi for the session entity. */
export class CreditNoteSupportDocumentGetterFromPlemsiUseCase {
  private readonly _creditNotePlemsiService: GetCreditNoteSupportDocumentPlemsiService
  private readonly _getEntityByIdService: GetEntityByIdService

  constructor(entityRepository: EntityRepository) {
    this._creditNotePlemsiService = new GetCreditNoteSupportDocumentPlemsiService()
    this._getEntityByIdService = new GetEntityByIdService(entityRepository)
  }

  /** Returns the Plemsi paginated list wrapped for the API response. */
  async run(entityId: string, page: number): Promise<{ data: unknown }> {
    try {
      const entity = await this._getEntityByIdService.run(entityId || '')
      if (entity) {
        const response = await this._creditNotePlemsiService.run(entity.apiKeyPlemsi ?? '', page)

        return { data: response.data.data }
      }

      throw 'No se encontró la entidad'
    } catch (error) {
      throw new UnhandledException(`Notas crédito de documento soporte desde Plemsi, error: ${error}`)
    }
  }
}
