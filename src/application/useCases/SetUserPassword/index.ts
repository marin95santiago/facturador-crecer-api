import bcrypt from 'bcrypt'
import { UserRepository } from '../../../domain/repositories/User.repository'
import { GetUserByIdService } from '../../../domain/services/user/GetUserById.service'
import { verifyPasswordSetupToken } from '../../../domain/services/user/PasswordSetupToken.service'
import { UserNotFoundException } from '../../../domain/exceptions/user/UserNotFound.exception'
import { InvalidPasswordSetupTokenException } from '../../../domain/exceptions/user/InvalidPasswordSetupToken.exception'
import { PasswordRequiredException } from '../../../domain/exceptions/user/PasswordRequired.exception'

const BCRYPT_SALT = 12

export class SetUserPasswordUseCase {
  private readonly _getUserByIdService: GetUserByIdService

  constructor (private readonly _userRepository: UserRepository) {
    this._getUserByIdService = new GetUserByIdService(_userRepository)
  }

  /** Sets a user password from a valid password_setup JWT. */
  async run (token: string, password: string, secret: string): Promise<{ updated: true }> {
    if (password === undefined || password === '') {
      throw new PasswordRequiredException()
    }

    const tokenPayload = verifyPasswordSetupToken(token, secret)
    const user = await this._getUserByIdService.run(tokenPayload.userId)

    if (user === null) {
      throw new UserNotFoundException()
    }

    if (user.email !== tokenPayload.email) {
      throw new InvalidPasswordSetupTokenException()
    }

    const hash = await bcrypt.hash(password, BCRYPT_SALT)
    user.password = hash
    await this._userRepository.update(user)

    return { updated: true }
  }
}
