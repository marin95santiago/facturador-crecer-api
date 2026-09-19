import { NextFunction, Request, Response } from 'express'
import { RequestPasswordChangeUseCase } from '../../../../../application/useCases/RequestPasswordChange'
import { NodemailerEmailSender } from '../../../../../domain/services/email/NodemailerEmailSender'

/** Sends a password change email to the authenticated session user. */
export const requestPasswordChange = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const secret = process.env.SECRET ?? ''
  const frontUrl = process.env.FRONT_URL ?? 'http://localhost:3000'
  const emailSender = new NodemailerEmailSender()
  const requestPasswordChangeUseCase = new RequestPasswordChangeUseCase(emailSender)

  try {
    const session = JSON.parse(req.params.sessionUser)
    const userId = session.data.user.id
    const email = session.data.user.email

    const result = await requestPasswordChangeUseCase.run(userId, email, secret, frontUrl)
    res.json(result)
  } catch (error) {
    next(error)
  }
}
