export class TooManyForgotPasswordAttemptsException extends Error {
  constructor () {
    super('Demasiados intentos. Intente nuevamente más tarde.')
  }
}
