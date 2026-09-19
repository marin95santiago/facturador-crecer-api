import type { IEmailSender } from '../../../domain/entities/EmailSender.entity'
import { UserRepository } from '../../../domain/repositories/User.repository'
import { consumeForgotPasswordAttempt } from '../../../domain/services/user/ForgotPasswordRateLimit.service'
import { GetUserByEmailService } from '../../../domain/services/user/GetUserByEmail.service'
import { RequestPasswordChangeUseCase } from '../RequestPasswordChange'

export class ForgotPasswordUseCase {
  private readonly _getUserByEmailService: GetUserByEmailService
  private readonly _requestPasswordChangeUseCase: RequestPasswordChangeUseCase

  constructor (
    userRepository: UserRepository,
    emailSender: IEmailSender
  ) {
    this._getUserByEmailService = new GetUserByEmailService(userRepository)
    this._requestPasswordChangeUseCase = new RequestPasswordChangeUseCase(emailSender)
  }

  /** Sends a password reset email when the user exists, always returning a uniform success response. */
  async run (
    email: string,
    clientIp: string,
    secret: string,
    frontUrl: string
  ): Promise<{ sent: true }> {
    consumeForgotPasswordAttempt(clientIp)

    const normalizedEmail = email.trim().toLowerCase()
    const user = await this._getUserByEmailService.run(normalizedEmail)

    if (user === null) {
      console.info('Forgot password requested for unknown email', { clientIp })
      return { sent: true }
    }

    await this._requestPasswordChangeUseCase.run(user.id, user.email, secret, frontUrl)

    return { sent: true }
  }
}
