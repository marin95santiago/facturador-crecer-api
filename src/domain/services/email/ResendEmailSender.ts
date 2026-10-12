import path from 'path'
import * as dotenv from 'dotenv'
import type { IEmailSender, SendEmailParams } from '../../entities/EmailSender.entity'

dotenv.config({
  path: path.resolve(__dirname, '../../../../.env')
})

const RESEND_API_URL = 'https://api.resend.com/emails'
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? ''
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? ''
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME ?? 'Sistema Crecer'

export class ResendEmailSender implements IEmailSender {
  async send (params: SendEmailParams): Promise<void> {
    const { html, subject, to, cc } = params

    if (RESEND_API_KEY === '' || RESEND_FROM_EMAIL === '') {
      throw new Error('RESEND_API_KEY y RESEND_FROM_EMAIL son obligatorias para enviar emails')
    }

    const from = SMTP_FROM_NAME !== '' ? `${SMTP_FROM_NAME} <${RESEND_FROM_EMAIL}>` : RESEND_FROM_EMAIL

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to,
        cc: cc.length > 0 ? cc : undefined,
        subject,
        html
      })
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`Error al enviar email vía Resend (${response.status}): ${errorBody}`)
    }
  }
}
