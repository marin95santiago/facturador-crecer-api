import { NextFunction, Request, Response } from 'express'
import { DynamoDBUserRepository } from '../../../../implementations/AWS/dynamoDB/DynamoDBUserRepository'
import { DynamoDBEntityRepository } from '../../../../implementations/AWS/dynamoDB/DynamoDBEntityRepository'
import { LoginUseCase } from '../../../../../application/useCases/Login'
import { DynamoDBRefreshTokenRepository } from '../../../../implementations/AWS/dynamoDB/DynamoDBRefreshTokenRepository'
import { setRefreshTokenCookie } from './refreshToken.helper'

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email, password } = req.body
  const secret = process.env.SECRET ?? ''
  const dynamoDBUserRepo = new DynamoDBUserRepository()
  const dynamoDBEntityRepository = new DynamoDBEntityRepository()
  const refreshTokenRepository = new DynamoDBRefreshTokenRepository()
  const loginUseCase = new LoginUseCase(dynamoDBUserRepo, dynamoDBEntityRepository, refreshTokenRepository)

  try {
    const result = await loginUseCase.run(email, password, secret)
    setRefreshTokenCookie(res, result.refreshToken)
    res.json({ token: result.token })
  } catch (error) {
    return next(error)
  }
}
