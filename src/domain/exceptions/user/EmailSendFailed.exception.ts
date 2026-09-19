export class EmailSendFailedException extends Error {
  constructor () {
    super('No se pudo enviar el correo. Intente nuevamente más tarde.')
  }
}
