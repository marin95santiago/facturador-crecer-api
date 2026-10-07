import jwt from 'jsonwebtoken'
import { RefreshTokenRepository } from '../../../domain/repositories/RefreshToken.repository'
import { UserRepository } from '../../../domain/repositories/User.repository'
import { EntityRepository } from '../../../domain/repositories/Entity.repository'
import { GetUserByIdService } from '../../../domain/services/user/GetUserById.service'
import { GetEntityByIdService } from '../../../domain/services/entity/GetEntityById.service'
import {
  accessTokenExpUnix,
  generateRefreshTokenValue,
  hashRefreshToken,
  refreshTokenExpiresAtUnix
} from '../../../infrastructure/driving-adapters/API/controllers/login/refreshToken.helper'

export type RefreshTokenErrorCode =
  | 'REFRESH_TOKEN_INVALID'
  | 'REFRESH_TOKEN_REUSED'
  | 'REFRESH_TOKEN_EXPIRED'

export type RefreshSessionResult =
  | { ok: true, token: string, refreshToken: string }
  | { ok: false, code: RefreshTokenErrorCode, clearCookie: boolean }

export class RefreshSessionUseCase {
  private readonly _getUserByIdService: GetUserByIdService
  private readonly _getEntityByIdService: GetEntityByIdService

  constructor (
    private readonly _refreshTokenRepository: RefreshTokenRepository,
    userRepository: UserRepository,
    entityRepository: EntityRepository,
    private readonly _secret: string
  ) {
    this._getUserByIdService = new GetUserByIdService(userRepository)
    this._getEntityByIdService = new GetEntityByIdService(entityRepository)
  }

  /** Validates the refresh cookie, rotates it, and returns a new access token. */
  async run (rawRefreshToken: string | undefined): Promise<RefreshSessionResult> {
    if (rawRefreshToken === undefined || rawRefreshToken === '') {
      return { ok: false, code: 'REFRESH_TOKEN_INVALID', clearCookie: false }
    }

    const tokenHash = hashRefreshToken(rawRefreshToken)
    const row = await this._refreshTokenRepository.findByHash(tokenHash)

    if (row === null) {
      return { ok: false, code: 'REFRESH_TOKEN_INVALID', clearCookie: false }
    }

    const nowUnix = Math.floor(Date.now() / 1000)

    if (row.revokedAt !== undefined) {
      await this._refreshTokenRepository.revokeAllActiveInFamily(row.familyId, nowUnix)
      return { ok: false, code: 'REFRESH_TOKEN_REUSED', clearCookie: true }
    }

    if (row.expiresAt <= nowUnix) {
      return { ok: false, code: 'REFRESH_TOKEN_EXPIRED', clearCookie: false }
    }

    const user = await this._getUserByIdService.run(row.userId)
    if (user === null || user.state !== 'ACTIVE') {
      await this._refreshTokenRepository.revokeByHashIfActive(tokenHash, nowUnix)
      return { ok: false, code: 'REFRESH_TOKEN_INVALID', clearCookie: true }
    }

    const newRawToken = generateRefreshTokenValue()
    const newTokenHash = hashRefreshToken(newRawToken)
    const expiresAt = refreshTokenExpiresAtUnix()

    const successorRow = {
      tokenHash: newTokenHash,
      familyId: row.familyId,
      userId: row.userId,
      expiresAt,
      createdAt: nowUnix,
      ttl: expiresAt
    }

    const rotationOutcome = await this._refreshTokenRepository.rotateToken(
      tokenHash,
      successorRow,
      nowUnix
    )

    if (rotationOutcome === 'already_revoked') {
      await this._refreshTokenRepository.revokeAllActiveInFamily(row.familyId, nowUnix)
      return { ok: false, code: 'REFRESH_TOKEN_REUSED', clearCookie: true }
    }

    if (rotationOutcome === 'failed') {
      return { ok: false, code: 'REFRESH_TOKEN_INVALID', clearCookie: false }
    }

    const entity = await this._getEntityByIdService.run(user.entityId)
    delete user.password

    const token = jwt.sign({
      exp: accessTokenExpUnix(),
      data: {
        user,
        entity: entity ?? undefined
      }
    }, this._secret)

    return { ok: true, token, refreshToken: newRawToken }
  }
}
