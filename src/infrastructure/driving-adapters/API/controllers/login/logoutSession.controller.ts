import { NextFunction, Request, Response } from 'express'
import { DynamoDBRefreshTokenRepository } from '../../../../implementations/AWS/dynamoDB/DynamoDBRefreshTokenRepository'
import { LogoutSessionUseCase } from '../../../../../application/useCases/LogoutSession'
import { clearRefreshTokenCookie, readRefreshTokenFromRequest } from './refreshToken.helper'

/** Revokes this device's refresh token and clears the cookie. */
export const logoutSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const refreshTokenRepository = new DynamoDBRefreshTokenRepository()
  const useCase = new LogoutSessionUseCase(refreshTokenRepository)

  try {
    const rawToken = readRefreshTokenFromRequest(req)
    await useCase.run(rawToken)
    clearRefreshTokenCookie(res)
    res.sendStatus(200)
  } catch (error) {
    return next(error)
  }
}
