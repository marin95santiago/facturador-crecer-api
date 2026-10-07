import crypto from 'crypto'
import { Request, Response } from 'express'

export const ACCESS_TOKEN_EXP_SECONDS = 15 * 60
export const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60

const REFRESH_COOKIE_NAME = 'refreshToken'
const REFRESH_COOKIE_PATH = '/api/v2/login'

/** Returns shared cookie options for set and clear. */
function getRefreshCookieOptions (): {
  httpOnly: boolean
  path: string
  sameSite: 'lax'
  secure: boolean
} {
  const frontUrl = process.env.FRONT_URL ?? 'http://localhost:3000'
  let secure = false
  if (frontUrl.startsWith('https')) {
    secure = true
  }

  return {
    httpOnly: true,
    path: REFRESH_COOKIE_PATH,
    sameSite: 'lax',
    secure
  }
}

/** Returns Unix exp for an access token issued now. */
export function accessTokenExpUnix (): number {
  return Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXP_SECONDS
}

/** Generates a random refresh token value (base64url). */
export function generateRefreshTokenValue (): string {
  return crypto.randomBytes(32).toString('base64url')
}

/** SHA-256 hex digest of the refresh token cookie value. */
export function hashRefreshToken (rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex')
}

/** Sets the httpOnly refresh token cookie on the response. */
export function setRefreshTokenCookie (res: Response, rawToken: string): void {
  res.cookie(REFRESH_COOKIE_NAME, rawToken, {
    ...getRefreshCookieOptions(),
    maxAge: REFRESH_TOKEN_MAX_AGE_MS
  })
}

/** Clears the refresh token cookie using the same attributes as set. */
export function clearRefreshTokenCookie (res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions())
}

/** Reads the refresh token from the Cookie header (not req.cookies). */
export function readRefreshTokenFromRequest (req: Request): string | undefined {
  const cookieHeader = req.headers.cookie
  if (cookieHeader === undefined || cookieHeader === '') {
    return undefined
  }

  const parts = cookieHeader.split(';')
  for (const part of parts) {
    const trimmed = part.trim()
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) {
      continue
    }
    const name = trimmed.slice(0, eqIndex)
    if (name === REFRESH_COOKIE_NAME) {
      return trimmed.slice(eqIndex + 1)
    }
  }

  return undefined
}

/** Unix seconds for refresh token expiry and DynamoDB TTL from now. */
export function refreshTokenExpiresAtUnix (): number {
  return Math.floor(Date.now() / 1000) + REFRESH_TOKEN_TTL_SECONDS
}
