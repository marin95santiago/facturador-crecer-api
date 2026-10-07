export interface RefreshTokenRecord {
  tokenHash: string
  familyId: string
  userId: string
  expiresAt: number
  revokedAt?: number
  createdAt: number
  ttl: number
}

export interface NewRefreshTokenRow {
  tokenHash: string
  familyId: string
  userId: string
  expiresAt: number
  createdAt: number
  ttl: number
}

export type RotateRefreshTokenOutcome = 'rotated' | 'already_revoked' | 'failed'

export interface RefreshTokenRepository {
  /** Persists a new refresh token row for a fresh login session. */
  saveNew: (row: NewRefreshTokenRow) => Promise<void>
  /** Loads a refresh token row by its SHA-256 hash. */
  findByHash: (tokenHash: string) => Promise<RefreshTokenRecord | null>
  /** Sets revokedAt on one row if it is still active. */
  revokeByHashIfActive: (tokenHash: string, revokedAt: number) => Promise<void>
  /** Revokes every active row in a rotation family. */
  revokeAllActiveInFamily: (familyId: string, revokedAt: number) => Promise<void>
  /** Atomically revokes the presented token and inserts the successor row. */
  rotateToken: (
    presentedTokenHash: string,
    successorRow: NewRefreshTokenRow,
    revokedAt: number
  ) => Promise<RotateRefreshTokenOutcome>
}
