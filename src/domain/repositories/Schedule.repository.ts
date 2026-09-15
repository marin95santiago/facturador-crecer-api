import { Schedule } from 'domain/entities/Schedule.entity'

export interface ScheduleRepository {
  getByEntity: (entityId: string, entity: string, limit?: number, lastEvaluatedKey?: any) => Promise<{lastEvaluatedKey: any, schedules: Schedule[]}>
  getAll: () => Promise<Schedule[]>
  save: (scheduleForm: Schedule) => Promise<Schedule>
  delete: (entityId: string, code: string) => Promise<{ message: string }>
  deleteByEntityId: (entityId: string) => Promise<number>
}
