import { NextFunction, Request, Response } from 'express'
import { SupportDocumentCreditNotePresenterUseCase } from '../../../../../application/useCases/SupportDocumentCreditNotePresenter'
import { validatePermission } from '../../utils'
import permissionsList from '../../permission.json'
import { PermissionNotAvailableException } from '../../../../../domain/exceptions/common/PermissionNotAvailable.exception'

/** Presents a support-document credit note for the support document identified by CUDE. */
export const presentSupportDocumentCreditNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { sessionUser, cude } = req.params

  const supportDocumentCreditNotePresenterUseCase = new SupportDocumentCreditNotePresenterUseCase()

  try {
    const session = JSON.parse(sessionUser)
    const doesSuperAdminHavePermission = true

    const havePermission = validatePermission(
      permissionsList.support_document.present_credit_note,
      session.data.user.permissions,
      doesSuperAdminHavePermission
    )

    if (!havePermission) {
      throw new PermissionNotAvailableException()
    }

    const response = await supportDocumentCreditNotePresenterUseCase.run(
      session.data.user.entityId,
      cude
    )

    res.json({ message: 'Nota crédito de documento soporte presentada correctamente', data: response })
    return
  } catch (error) {
    return next(error)
  }
}
