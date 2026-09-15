export interface PendingControlCode {
  code: string
  expiration: number
  entityId: string
  requestedBy: string
  requestNumber: number
}

export interface AuthTokenRepository {
  saveCode: (email: string, data: PendingControlCode) => Promise<void>
  getCodeByEmail: (email: string) => Promise<PendingControlCode | null>
  getByCode: (code: string) => Promise<PendingControlCode | null>
  deleteCode: (code: string, entityId: string) => Promise<void>
  deleteByEntityId: (entityId: string) => Promise<number>
  getEmailBlock: (email: string) => Promise<{ blockedUntil: number } | null>
  setEmailBlock: (email: string, blockedUntil: number) => Promise<void>
  getIpBlock: (ip: string) => Promise<{ blockedUntil: number } | null>
  setIpBlock: (ip: string, blockedUntil: number) => Promise<void>
  getIpAttempts: (ip: string) => Promise<{ consecutiveNotFoundCount: number } | null>
  incrementIpAttempts: (ip: string) => Promise<number>
  resetIpAttempts: (ip: string) => Promise<void>
}
