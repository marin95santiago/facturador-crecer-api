import { NextFunction, Request, Response } from 'express'
import { SetUserPasswordUseCase } from '../../../../../application/useCases/SetUserPassword'
import { DynamoDBUserRepository } from '../../../../implementations/AWS/dynamoDB/DynamoDBUserRepository'

/** Sets a user password from a password_setup JWT without requiring a session. */
export const setUserPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { token, password } = req.body
  const secret = process.env.SECRET ?? ''
  const userRepository = new DynamoDBUserRepository()
  const setUserPasswordUseCase = new SetUserPasswordUseCase(userRepository)

  try {
    const result = await setUserPasswordUseCase.run(token, password, secret)
    res.json(result)
  } catch (error) {
    next(error)
  }
}
