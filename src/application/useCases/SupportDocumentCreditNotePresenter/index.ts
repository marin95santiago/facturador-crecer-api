import { PlemsiDocumentService } from '../../../domain/services/electronicBill/PlemsiDocument.service'
import { DynamoDBEntityRepository } from '../../../infrastructure/implementations/AWS/dynamoDB/DynamoDBEntityRepository'
import { UnhandledException } from '../../../domain/exceptions/common/Unhandled.exception'

const PLEMSI_ERROR_BILL_STILL_PENDING_EMIT_CODE = process.env.PLEMSI_ERROR_BILL_STILL_PENDING_EMIT_CODE || ''

/** Presents a support-document credit note in Plemsi for the given support document CUDE. */
export class SupportDocumentCreditNotePresenterUseCase {
  /** Runs the NCDS presentation flow and updates the entity consecutive on success. */
  async run(entityId: string, cude: string): Promise<unknown> {
    const dynamoDBEntityRepository = new DynamoDBEntityRepository()
    const plemsiDocumentService = new PlemsiDocumentService()

    const entity = await dynamoDBEntityRepository.getById(entityId)
    if (!entity) {
      throw new Error('Entidad no encontrada')
    }

    if (
      !entity.resolutionNCDS ||
      !entity.resolutionTextNCDS ||
      !entity.prefixNCDS ||
      entity.lastCreditSupportDocumentNumber === undefined
    ) {
      throw new Error('No se ha configurado la resolución de nota crédito de documento soporte para esta entidad')
    }

    const supportDocumentResponse = await plemsiDocumentService.getElectronicSupportDocument(entity, cude)
    const supportDocumentData = supportDocumentResponse?.data as Record<string, unknown> | undefined

    if (!supportDocumentData) {
      throw new UnhandledException('Documento soporte no encontrado')
    }

    const creditNoteNumber = entity.lastCreditSupportDocumentNumber + 1

    const creditNoteResponse = await plemsiDocumentService.buildCreditNoteSupportDocumentFromSupportDocument(
      supportDocumentData,
      entity,
      creditNoteNumber
    ) as { success?: boolean; errCode?: string }

    const plemsiAccepted = creditNoteResponse.success === true ||
      creditNoteResponse.errCode === PLEMSI_ERROR_BILL_STILL_PENDING_EMIT_CODE

    if (!plemsiAccepted) {
      throw new Error('Error al presentar la nota crédito de documento soporte ante la DIAN')
    }

    await dynamoDBEntityRepository.update({
      ...entity,
      lastCreditSupportDocumentNumber: creditNoteNumber
    })

    return creditNoteResponse
  }
}
