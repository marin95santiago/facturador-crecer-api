import { ElectronicBill } from 'domain/entities/ElectronicBill.entity'

export interface ElectronicBillRepository {
  save: (electronicBill: ElectronicBill) => Promise<ElectronicBill>
  getAll: (entityId: string, limit?: number, lastEvaluatedKey?: any) => Promise<{lastEvaluatedKey: any, bills: ElectronicBill[]}>
  getByNumber: (entityId: string, number: number) => Promise<ElectronicBill | null>
  deleteByEntityId: (entityId: string) => Promise<number>
}
