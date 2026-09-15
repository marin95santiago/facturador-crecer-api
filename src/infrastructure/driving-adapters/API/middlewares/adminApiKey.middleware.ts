import crypto from 'crypto'
import { NextFunction, Request, Response } from 'express'

/** Validates the admin API key from the x-api-key header. */
export const validateAdminApiKey = (req: Request, res: Response, next: NextFunction): Response | void => {
  const adminApiKey = process.env.API_KEY_ADMIN ?? ''
  const providedApiKey = req.headers['x-api-key']

  if (adminApiKey === '' || typeof providedApiKey !== 'string') {
    return res.status(403).json({ message: 'Invalid or missing admin API key' })
  }

  const adminKeyBuffer = Buffer.from(adminApiKey)
  const providedKeyBuffer = Buffer.from(providedApiKey)

  if (adminKeyBuffer.length !== providedKeyBuffer.length) {
    return res.status(403).json({ message: 'Invalid or missing admin API key' })
  }

  const isValidKey = crypto.timingSafeEqual(adminKeyBuffer, providedKeyBuffer)

  if (!isValidKey) {
    return res.status(403).json({ message: 'Invalid or missing admin API key' })
  }

  next()
}
