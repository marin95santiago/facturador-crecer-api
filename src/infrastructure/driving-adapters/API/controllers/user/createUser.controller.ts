import { NextFunction, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { UserCreatorUseCase } from '../../../../../application/useCases/UserCreator'
import { buildPasswordSetupLink, signPasswordSetupToken } from '../../../../../domain/services/user/PasswordSetupToken.service'
import { DynamoDBUserRepository } from '../../../../implementations/AWS/dynamoDB/DynamoDBUserRepository'

/** Creates a user without a password and returns a temporary setup link. */
export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const {
    email,
    name,
    lastname,
    entityId,
    permissions
  } = req.body

  const secret = process.env.SECRET ?? ''
  const frontUrl = process.env.FRONT_URL ?? 'http://localhost:3000'
  const dynamoDBUserRepo = new DynamoDBUserRepository()
  const userCreatorUseCase = new UserCreatorUseCase(dynamoDBUserRepo)

  try {
    const userCreated = await userCreatorUseCase.run({
      id: uuidv4(),
      state: 'ACTIVE',
      email,
      name,
      lastname,
      entityId,
      permissions
    })

    const token = signPasswordSetupToken(userCreated.id, userCreated.email, secret)
    const passwordSetupLink = buildPasswordSetupLink(frontUrl, token)

    res.json({
      ...userCreated,
      passwordSetupLink
    })
  } catch (error) {
    next(error)
  }
}
