import jwt from 'jsonwebtoken'
import { NextFunction, Request, Response } from 'express'
import { InvalidPasswordSetupTokenException } from '../../../../domain/exceptions/user/InvalidPasswordSetupToken.exception'
import { UnhandledException } from '../../../../domain/exceptions/common/Unhandled.exception'

/** Validates a session Bearer token and attaches the decoded payload to the request. */
export const validateToken = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  const { authorization } = req.headers
  const token = authorization?.slice(7)
  const secret = process.env.SECRET ?? ''

  try {
    if (token === undefined) {
      return res.status(403).send({ message: 'Token is not supplied' })
    }

    const decoded = jwt.verify(token, secret) as jwt.JwtPayload

    if (decoded.data !== undefined && typeof decoded.data === 'object') {
      const data = decoded.data as Record<string, unknown>

      if (data.purpose === 'password_setup') {
        throw new InvalidPasswordSetupTokenException()
      }
    }

    req.params.sessionUser = JSON.stringify(decoded)
    next()
  } catch (error) {
    if (error instanceof InvalidPasswordSetupTokenException) {
      return next(error)
    }

    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return next(new UnhandledException('Token'))
    }

    return next(error)
  }
}
