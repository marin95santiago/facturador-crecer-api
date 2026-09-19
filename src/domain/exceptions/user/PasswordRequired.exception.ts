export class PasswordRequiredException extends Error {
  constructor () {
    super('La contraseña es requerida.')
  }
}
