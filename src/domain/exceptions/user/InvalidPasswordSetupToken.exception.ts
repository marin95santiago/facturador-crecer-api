export class InvalidPasswordSetupTokenException extends Error {
  constructor () {
    super('El enlace para establecer la contraseña no es válido.')
  }
}
