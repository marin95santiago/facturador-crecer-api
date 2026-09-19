import { UserRepository } from '../../../domain/repositories/User.repository'
import { GetUserByEmailService } from '../../../domain/services/user/GetUserByEmail.service'
import { buildPasswordSetupLink, signPasswordSetupToken } from '../../../domain/services/user/PasswordSetupToken.service'
import { UserNotFoundException } from '../../../domain/exceptions/user/UserNotFound.exception'

export class RebuildPasswordSetupLinkUseCase {
  private readonly _getUserByEmailService: GetUserByEmailService

  constructor (private readonly _userRepository: UserRepository) {
    this._getUserByEmailService = new GetUserByEmailService(_userRepository)
  }

  /** Generates a new password setup link for an existing user. */
  async run (email: string, secret: string, frontUrl: string): Promise<{ passwordSetupLink: string }> {
    const user = await this._getUserByEmailService.run(email)

    if (user === null) {
      throw new UserNotFoundException()
    }

    const token = signPasswordSetupToken(user.id, user.email, secret)
    const passwordSetupLink = buildPasswordSetupLink(frontUrl, token)

    return { passwordSetupLink }
  }
}
