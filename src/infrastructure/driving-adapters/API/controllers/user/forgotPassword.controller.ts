import { NextFunction, Request, Response } from 'express'
import { ForgotPasswordUseCase } from '../../../../../application/useCases/ForgotPassword'
import { MissingPropertyException } from '../../../../../domain/exceptions/common/MissingProperty.exception'
import { NodemailerEmailSender } from '../../../../../domain/services/email/NodemailerEmailSender'
import { DynamoDBUserRepository } from '../../../../implementations/AWS/dynamoDB/DynamoDBUserRepository'

/** Sends a password reset email for the given address without requiring a session. */
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email } = req.body
  const secret = process.env.SECRET ?? ''
  const frontUrl = process.env.FRONT_URL ?? 'http://localhost:3000'
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.socket?.remoteAddress ?? '0.0.0.0'

  if (email === undefined || typeof email !== 'string' || email.trim() === '') {
    return next(new MissingPropertyException('email'))
  }

  const userRepository = new DynamoDBUserRepository()
  const emailSender = new NodemailerEmailSender()
  const forgotPasswordUseCase = new ForgotPasswordUseCase(userRepository, emailSender)

  try {
    const result = await forgotPasswordUseCase.run(email, clientIp, secret, frontUrl)
    res.json(result)
  } catch (error) {
    next(error)
  }
}
