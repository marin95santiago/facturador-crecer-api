import { NextFunction, Request, Response } from 'express'
import { ResendEmailSender } from '../../../../../domain/services/email/ResendEmailSender'
import { SendEmailUseCase } from '../../../../../application/useCases/SendEmail'
export const sendEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { html, subject, to, cc } = req.body

  const emailSender = new ResendEmailSender()
  const sendEmailUseCase = new SendEmailUseCase(emailSender)

  try {
    const result = await sendEmailUseCase.run(html, subject, to, cc ?? [])
    res.json(result)
  } catch (error) {
    return next(error)
  }
}
