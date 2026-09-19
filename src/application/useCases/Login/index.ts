import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { GetUserByEmailService } from '../../../domain/services/user/GetUserByEmail.service'
import { GetEntityByIdService } from '../../../domain/services/entity/GetEntityById.service'
import { UserRepository } from '../../../domain/repositories/User.repository'
import { EntityRepository } from '../../../domain/repositories/Entity.repository'
import { UserNotFoundException } from '../../../domain/exceptions/user/UserNotFound.exception'
import { LoginWrongPasswordException } from '../../../domain/exceptions/user/LoginWrongPassword.exception'
import { PasswordNotSetException } from '../../../domain/exceptions/user/PasswordNotSet.exception'

export class LoginUseCase {
  private readonly _getUserByEmailService: GetUserByEmailService
  private readonly _getEntityByIdService: GetEntityByIdService

  constructor (userRepository: UserRepository, entityRepository: EntityRepository) {
    this._getUserByEmailService = new GetUserByEmailService(userRepository)
    this._getEntityByIdService = new GetEntityByIdService(entityRepository)
  }

  /** Authenticates a user by email and password and returns a session JWT. */
  async run (email: string, password: string, secret: string): Promise<{ token: string }> {
    const userToLogin = await this._getUserByEmailService.run(email)

    if (userToLogin === null) throw new UserNotFoundException()

    if (userToLogin.password === undefined || userToLogin.password === '') {
      throw new PasswordNotSetException()
    }

    const match = await bcrypt.compare(password, userToLogin.password)

    if (!match) throw new LoginWrongPasswordException()

    const entity = await this._getEntityByIdService.run(userToLogin.entityId)

    delete userToLogin.password

    const token = jwt.sign({
      exp: Math.floor(Date.now() / 1000) + (120 * 60),
      data: {
        user: userToLogin,
        entity: entity
      }
    }, secret)

    return {
      token
    }
  }
}
