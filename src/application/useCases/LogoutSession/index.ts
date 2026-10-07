import { RefreshTokenRepository } from '../../../domain/repositories/RefreshToken.repository'
import { hashRefreshToken } from '../../../infrastructure/driving-adapters/API/controllers/login/refreshToken.helper'

export class LogoutSessionUseCase {
  constructor (private readonly _refreshTokenRepository: RefreshTokenRepository) {}

  /** Revokes the refresh token row for this device's cookie, if still active. */
  async run (rawRefreshToken: string | undefined): Promise<void> {
    if (rawRefreshToken === undefined || rawRefreshToken === '') {
      return
    }

    const tokenHash = hashRefreshToken(rawRefreshToken)
    const revokedAt = Math.floor(Date.now() / 1000)
    await this._refreshTokenRepository.revokeByHashIfActive(tokenHash, revokedAt)
  }
}
