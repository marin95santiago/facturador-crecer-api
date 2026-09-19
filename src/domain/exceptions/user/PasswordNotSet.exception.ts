export class PasswordNotSetException extends Error {
  constructor () {
    super('Debe establecer su contraseña antes de iniciar sesión.')
  }
}
