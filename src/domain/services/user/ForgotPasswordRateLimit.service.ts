import { TooManyForgotPasswordAttemptsException } from '../../exceptions/user/TooManyForgotPasswordAttempts.exception'

const WINDOW_MS = 2 * 60 * 60 * 1000
const MAX_ATTEMPTS = 5

interface RateLimitEntry {
  attempts: number
  resetAt: number
}

const attemptsByIp = new Map<string, RateLimitEntry>()

/** Consumes one forgot-password attempt for the given IP and throws when the limit is exceeded. */
export function consumeForgotPasswordAttempt (clientIp: string): void {
  const now = Date.now()
  const existingEntry = attemptsByIp.get(clientIp)

  if (existingEntry === undefined || existingEntry.resetAt <= now) {
    attemptsByIp.set(clientIp, {
      attempts: 1,
      resetAt: now + WINDOW_MS
    })
    return
  }

  if (existingEntry.attempts >= MAX_ATTEMPTS) {
    throw new TooManyForgotPasswordAttemptsException()
  }

  existingEntry.attempts += 1
  attemptsByIp.set(clientIp, existingEntry)
}
