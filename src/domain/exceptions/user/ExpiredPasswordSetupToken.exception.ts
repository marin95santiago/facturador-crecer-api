export class ExpiredPasswordSetupTokenException extends Error {
  constructor () {
    super('El enlace para establecer la contraseña ha expirado.')
  }
}
