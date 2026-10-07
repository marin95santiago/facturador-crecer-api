import { NextFunction, Request, Response } from 'express'
import { DynamoDBRefreshTokenRepository } from '../../../../implementations/AWS/dynamoDB/DynamoDBRefreshTokenRepository'
import { DynamoDBUserRepository } from '../../../../implementations/AWS/dynamoDB/DynamoDBUserRepository'
import { DynamoDBEntityRepository } from '../../../../implementations/AWS/dynamoDB/DynamoDBEntityRepository'
import { RefreshSessionUseCase, RefreshTokenErrorCode } from '../../../../../application/useCases/RefreshSession'
import {
  clearRefreshTokenCookie,
  readRefreshTokenFromRequest,
  setRefreshTokenCookie
} from './refreshToken.helper'

const SECRET = process.env.SECRET ?? ''
const REFRESH_ERROR_MESSAGE = 'Por favor, inicie sesión nuevamente'

/** Maps refresh failure codes to client-facing Spanish messages. */
function refreshErrorMessage (code: RefreshTokenErrorCode): string {
  if (code === 'REFRESH_TOKEN_EXPIRED') {
    return 'Su sesión ha expirado. Por favor, inicie sesión nuevamente'
  }
  return REFRESH_ERROR_MESSAGE
}

/** Rotates the refresh cookie and returns a new access token. */
export const refreshSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const refreshTokenRepository = new DynamoDBRefreshTokenRepository()
  const userRepository = new DynamoDBUserRepository()
  const entityRepository = new DynamoDBEntityRepository()
  const useCase = new RefreshSessionUseCase(
    refreshTokenRepository,
    userRepository,
    entityRepository,
    SECRET
  )

  try {
    const rawToken = readRefreshTokenFromRequest(req)
    const result = await useCase.run(rawToken)

    if (!result.ok) {
      if (result.clearCookie) {
        clearRefreshTokenCookie(res)
      }
      res.status(401).json({
        message: refreshErrorMessage(result.code),
        code: result.code
      })
      return
    }

    setRefreshTokenCookie(res, result.refreshToken)
    res.json({ token: result.token })
  } catch (error) {
    return next(error)
  }
}
