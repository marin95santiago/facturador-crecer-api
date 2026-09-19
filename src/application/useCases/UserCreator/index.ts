import { UserRepository } from '../../../domain/repositories/User.repository'
import { ExistUserByEmailService } from '../../../domain/services/user/ExistUserByEmail.service'
import { UserAlreadyExistException } from '../../../domain/exceptions/user/UserAlreadyExist.exception'
import { User } from '../../../domain/entities/User.entity'
import { MissingPropertyException } from '../../../domain/exceptions/common/MissingProperty.exception'

export class UserCreatorUseCase {
  private readonly _userRepository: UserRepository
  private readonly _existUserByEmailService: ExistUserByEmailService

  constructor (userRepository: UserRepository) {
    this._userRepository = userRepository
    this._existUserByEmailService = new ExistUserByEmailService(userRepository)
  }

  /** Creates a user without a password; the password is set later via a setup link. */
  async run (body: User): Promise<User> {
    const existUser: boolean = await this._existUserByEmailService.run(body.email)

    if (existUser) throw new UserAlreadyExistException()

    if (body.email === undefined || body.email === '') throw new MissingPropertyException('email')
    if (body.name === undefined || body.name === '') throw new MissingPropertyException('name')
    if (body.lastname === undefined || body.lastname === '') throw new MissingPropertyException('lastname')
    if (body.entityId === undefined || body.entityId === '') throw new MissingPropertyException('entityId')

    body.password = ''
    await this._userRepository.save(body)

    delete body.password
    return body
  }
}
