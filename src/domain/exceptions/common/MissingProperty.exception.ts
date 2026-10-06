export class MissingPropertyException extends Error {
  constructor (property: string, message?: string) {
    if (message !== undefined && message !== '') {
      super(message)
    } else {
      super(`Missing the property: ${property}`)
    }
  }
}
