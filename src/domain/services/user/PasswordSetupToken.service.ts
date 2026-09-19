import jwt from 'jsonwebtoken'
import { ExpiredPasswordSetupTokenException } from '../../exceptions/user/ExpiredPasswordSetupToken.exception'
import { InvalidPasswordSetupTokenException } from '../../exceptions/user/InvalidPasswordSetupToken.exception'

const PASSWORD_SETUP_PURPOSE = 'password_setup'
const PASSWORD_SETUP_EXPIRY_SECONDS = 12 * 60 * 60

export interface PasswordSetupTokenPayload {
  userId: string
  email: string
}

/** Signs a password setup JWT valid for 12 hours. */
export function signPasswordSetupToken (userId: string, email: string, secret: string): string {
  return jwt.sign({
    exp: Math.floor(Date.now() / 1000) + PASSWORD_SETUP_EXPIRY_SECONDS,
    data: {
      purpose: PASSWORD_SETUP_PURPOSE,
      userId,
      email
    }
  }, secret)
}

/** Verifies a password setup JWT and returns the user id and email. */
export function verifyPasswordSetupToken (token: string, secret: string): PasswordSetupTokenPayload {
  try {
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload

    if (decoded.data === undefined || typeof decoded.data !== 'object') {
      throw new InvalidPasswordSetupTokenException()
    }

    const data = decoded.data as Record<string, unknown>

    if (data.purpose !== PASSWORD_SETUP_PURPOSE) {
      throw new InvalidPasswordSetupTokenException()
    }

    if (typeof data.userId !== 'string' || data.userId === '') {
      throw new InvalidPasswordSetupTokenException()
    }

    if (typeof data.email !== 'string' || data.email === '') {
      throw new InvalidPasswordSetupTokenException()
    }

    return {
      userId: data.userId,
      email: data.email
    }
  } catch (error) {
    if (error instanceof InvalidPasswordSetupTokenException) {
      throw error
    }

    if (error instanceof jwt.TokenExpiredError) {
      throw new ExpiredPasswordSetupTokenException()
    }

    throw new InvalidPasswordSetupTokenException()
  }
}

/** Builds the frontend URL for setting a password from a setup token. */
export function buildPasswordSetupLink (frontUrl: string, token: string): string {
  const baseUrl = frontUrl.replace(/\/$/, '')
  return `${baseUrl}/establecer-contrasena?token=${token}`
}
