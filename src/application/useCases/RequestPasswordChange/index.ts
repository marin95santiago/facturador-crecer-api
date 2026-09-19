import type { IEmailSender } from '../../../domain/entities/EmailSender.entity'
import { EmailSendFailedException } from '../../../domain/exceptions/user/EmailSendFailed.exception'
import { buildPasswordSetupLink, signPasswordSetupToken } from '../../../domain/services/user/PasswordSetupToken.service'

export class RequestPasswordChangeUseCase {
  constructor (private readonly _emailSender: IEmailSender) {}

  /** Sends a password change email with a 12-hour setup link to the given user. */
  async run (
    userId: string,
    email: string,
    secret: string,
    frontUrl: string
  ): Promise<{ sent: true }> {
    const token = signPasswordSetupToken(userId, email, secret)
    const passwordSetupLink = buildPasswordSetupLink(frontUrl, token)

    const html = `
      <p>Se ha solicitado un cambio de contraseña para su cuenta en Crecer.</p>
      <p><a href="${passwordSetupLink}">Establecer nueva contraseña</a></p>
      <p>Este enlace es válido por 12 horas. Si no solicitó este cambio, ignore este correo.</p>
    `

    try {
      await this._emailSender.send({
        html,
        subject: 'Cambio de contraseña',
        to: email,
        cc: []
      })
    } catch (error) {
      console.error('Failed to send password change email', { userId, email, error })
      throw new EmailSendFailedException()
    }

    return { sent: true }
  }
}
