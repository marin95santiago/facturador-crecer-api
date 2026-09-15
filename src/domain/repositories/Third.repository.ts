import { Third } from 'domain/entities/Third.entity'

export interface ThirdRepository {
  getAll: (entityId: string, limit?: number, lastEvaluatedKey?: any) => Promise<{lastEvaluatedKey: any, thirds: Third[]}>
  save: (third: Third) => Promise<Third>
  update: (third: Third) => Promise<Third>
  getByDocument: (document: string, entityId: string) => Promise<Third | null>
  deleteByEntityId: (entityId: string) => Promise<number>
}
