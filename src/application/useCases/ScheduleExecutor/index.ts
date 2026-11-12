import { ElectronicBillRepository } from 'domain/repositories/ElectronicBill.repository'
import { ScheduleRepository } from '../../../domain/repositories/Schedule.repository'
import { SubscriptionRepository } from '../../../domain/repositories/Subscription.repository'
import { ElectronicBillCreatorUseCase } from '../ElectronicBillCreator'
import { EntityRepository } from 'domain/repositories/Entity.repository'
import {
  getCurrentDateInAppTimezone,
  getDayAndMonthFromCalendarDate,
  getDayOfWeekFromCalendarDate
} from '../../../domain/services/utils/date.helper'

export class ScheduleExecutorUseCase {
  private readonly _scheduleRepository: ScheduleRepository
  private readonly _electronicBillRepository: ElectronicBillRepository
  private readonly _electronicBillCreatorUseCase:  ElectronicBillCreatorUseCase
  private DELETE_SCHEDULE = 'DELETE_SCHEDULE'

  constructor (scheduleRepository: ScheduleRepository, electronicBillRepository: ElectronicBillRepository, entityRepository: EntityRepository, subscriptionRepository: SubscriptionRepository) {
    this._scheduleRepository = scheduleRepository
    this._electronicBillRepository = electronicBillRepository
    this._electronicBillCreatorUseCase = new ElectronicBillCreatorUseCase(electronicBillRepository, entityRepository, subscriptionRepository)
  }

  /** Runs scheduled bill generation and deletes schedules that reached their inclusive end date. */
  async run (): Promise<any[]> {
    try {
      const schedules = await this._scheduleRepository.getAll()

      if (!schedules || schedules.length === 0) {
        throw 'No se encontraros procesos'
      }

      const finishedActions: any[] = []

      for (const schedule of schedules) {
        const decision = this.shouldGenerateBill(
          schedule.startDate,
          schedule.endDate ?? false,
          schedule.intervalDays
        )

        if (decision.generateBill) {
          try {
            const bill = await this._electronicBillRepository.getByNumber(schedule.entityId, Number(schedule.idForm))
            console.log(`Processing bill ${bill.number}...`)
            const data = await this._electronicBillCreatorUseCase.run({
              ...bill,
              date: this.getCurrentDate('AAAA-MM-DD'),
              paymentDueDate: this.getCurrentDate('AAAA/MM/DD')
            })
            console.log(`Processed bill ${data.data.number}:`, data)
            finishedActions.push({
              bill: data.data.number,
              status: 'success'
            })

            if (decision.requireAction === this.DELETE_SCHEDULE) {
              await this._scheduleRepository.delete(schedule.entityId, schedule.code)
            }
          } catch (error) {
            console.error(`Error processing bill ${schedule.idForm}:`, error)
            finishedActions.push({
              sourceBill: schedule.idForm,
              status: 'error',
              error: error
            })
          }

          await new Promise(resolve => setTimeout(resolve, 2000))
        } else if (decision.requireAction === this.DELETE_SCHEDULE) {
          await this._scheduleRepository.delete(schedule.entityId, schedule.code)
        }
      }

      return finishedActions
    } catch (error) {
      throw error
    }
  }

  shouldGenerateBill(startDate: string, endDate: string | false, interval: string) {
    const response = {
      generateBill: false,
      requireAction: ''
    }

    const currentDate = this.getCurrentDate('AAAA-MM-DD')

    if (endDate && endDate < currentDate) {
      response.requireAction = this.DELETE_SCHEDULE
      return response
    }

    if (startDate === currentDate) {
      response.generateBill = true
    } else {
      switch (interval) {
        case 'weekly': {
          const dayForStartDate = getDayOfWeekFromCalendarDate(startDate)
          const dayForCurrentDate = getDayOfWeekFromCalendarDate(currentDate)
          response.generateBill = (dayForStartDate === dayForCurrentDate)
          break
        }

        case 'monthly': {
          const dayMontStartDate = getDayAndMonthFromCalendarDate(startDate)
          const dayMontCurrentDate = getDayAndMonthFromCalendarDate(currentDate)
          response.generateBill = (dayMontStartDate.day === dayMontCurrentDate.day && dayMontStartDate.month !== dayMontCurrentDate.month)
          break
        }

        default:
          break
      }
    }

    // Inclusive end date: generate when due today, then delete after a successful run.
    if (endDate && endDate === currentDate) {
      response.requireAction = this.DELETE_SCHEDULE
    }

    return response
  }

  getCurrentDate(format: 'AAAA-MM-DD' | 'AAAA/MM/DD'): string {
    if (format === 'AAAA/MM/DD') {
      return getCurrentDateInAppTimezone('YYYY/MM/DD')
    }

    return getCurrentDateInAppTimezone('YYYY-MM-DD')
  }
}
