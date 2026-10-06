import { v4 as uuidv4 } from 'uuid'
import { Subscription } from '../../../domain/entities/Subscription.entity'
import { Entity } from '../../../domain/entities/Entity.entity'
import { SubscriptionRepository } from '../../../domain/repositories/Subscription.repository'
import { EntityRepository } from '../../../domain/repositories/Entity.repository'
import { MissingPropertyException } from '../../../domain/exceptions/common/MissingProperty.exception'
import { EntityNotFoundException } from '../../../domain/exceptions/entity/EntityNotFound.exception'
import { UnhandledException } from '../../../domain/exceptions/common/Unhandled.exception'

export interface CreateSubscriptionBody {
  entityId?: unknown
  maxDocuments?: unknown
  currentDocuments?: unknown
  startDate?: unknown
  endDate?: unknown
  description?: unknown
}

const MAX_TRANSACTION_ACTIONS = 100

export class SubscriptionCreatorUseCase {
  private readonly _subscriptionRepository: SubscriptionRepository
  private readonly _entityRepository: EntityRepository

  constructor (subscriptionRepository: SubscriptionRepository, entityRepository: EntityRepository) {
    this._subscriptionRepository = subscriptionRepository
    this._entityRepository = entityRepository
  }

  /** Creates an active subscription and deactivates the previous active ones of the entity. */
  async run (body: CreateSubscriptionBody): Promise<Subscription> {
    const entityId = this.readEntityId(body.entityId)
    const maxDocuments = this.readMaxDocuments(body.maxDocuments)
    const startDate = this.readStartDate(body.startDate)
    const endDate = this.readEndDate(body.endDate, startDate)
    const description = this.readDescription(body.description)
    const currentDocuments = this.readCurrentDocuments(body.currentDocuments)

    let entity: Entity | null = null
    try {
      entity = await this._entityRepository.getById(entityId)
    } catch (error) {
      console.error('Failed to load entity while creating subscription', { entityId, error })
      throw error
    }

    if (entity === null) {
      throw new EntityNotFoundException()
    }

    const subscription: Subscription = {
      id: uuidv4(),
      entityId,
      maxDocuments,
      currentDocuments,
      active: true,
      startDate,
      endDate,
      description,
      createdAt: new Date().toISOString()
    }

    try {
      const existingSubscriptions = await this._subscriptionRepository.getByEntityId(entityId)
      const previousActiveIds: string[] = []

      for (const existingSubscription of existingSubscriptions) {
        if (existingSubscription.active) {
          previousActiveIds.push(existingSubscription.id)
        }
      }

      // One action is reserved for the new item. 100 or more actives cannot fit in one transaction.
      if (previousActiveIds.length >= MAX_TRANSACTION_ACTIONS) {
        console.error('Refusing subscription creation because active rows exceed the DynamoDB transaction limit', {
          entityId,
          activeCount: previousActiveIds.length
        })
        throw new UnhandledException('subscription')
      }

      return await this._subscriptionRepository.createDeactivatingPrevious(subscription, previousActiveIds)
    } catch (error) {
      if (error instanceof UnhandledException) {
        throw error
      }
      console.error('Failed to create subscription', { entityId, error })
      throw error
    }
  }

  /** Reads a required entity id. */
  private readEntityId (value: unknown): string {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new MissingPropertyException('entityId')
    }
    return value.trim()
  }

  /** Reads a required non-negative integer quota. */
  private readMaxDocuments (value: unknown): number {
    if (value === undefined || value === null) {
      throw new MissingPropertyException('maxDocuments')
    }
    if (!isNonNegativeInteger(value)) {
      throw new MissingPropertyException('maxDocuments', 'maxDocuments debe ser un entero mayor o igual a 0')
    }
    return value
  }

  /** Reads a required start date in YYYY-MM-DD form. */
  private readStartDate (value: unknown): string {
    if (value === undefined || value === null || value === '') {
      throw new MissingPropertyException('startDate')
    }
    if (typeof value !== 'string' || !isCalendarDate(value)) {
      throw new MissingPropertyException('startDate', 'startDate debe tener el formato YYYY-MM-DD')
    }
    return value
  }

  /** Reads a required end date that is not before the start date. */
  private readEndDate (value: unknown, startDate: string): string {
    if (value === undefined || value === null || value === '') {
      throw new MissingPropertyException('endDate')
    }
    if (typeof value !== 'string' || !isCalendarDate(value)) {
      throw new MissingPropertyException('endDate', 'endDate debe tener el formato YYYY-MM-DD')
    }
    if (value < startDate) {
      throw new MissingPropertyException('endDate', 'endDate debe ser igual o posterior a startDate')
    }
    return value
  }

  /** Reads a required non-empty description. */
  private readDescription (value: unknown): string {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new MissingPropertyException('description')
    }
    return value.trim()
  }

  /** Reads an optional non-negative document count, defaulting to zero. */
  private readCurrentDocuments (value: unknown): number {
    if (value === undefined || value === null) {
      return 0
    }
    if (!isNonNegativeInteger(value)) {
      throw new MissingPropertyException('currentDocuments', 'currentDocuments debe ser un entero mayor o igual a 0')
    }
    return value
  }
}

/** Returns true when value is an integer greater than or equal to zero. */
function isNonNegativeInteger (value: unknown): value is number {
  if (typeof value !== 'number') {
    return false
  }
  if (!Number.isInteger(value)) {
    return false
  }
  if (value < 0) {
    return false
  }
  return true
}

/** Returns true when value is a real calendar date in YYYY-MM-DD form. */
function isCalendarDate (value: string): boolean {
  const parts = value.split('-')
  if (parts.length !== 3) {
    return false
  }

  const yearText = parts[0]
  const monthText = parts[1]
  const dayText = parts[2]
  if (yearText.length !== 4 || monthText.length !== 2 || dayText.length !== 2) {
    return false
  }

  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false
  }

  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year) {
    return false
  }
  if (date.getUTCMonth() !== month - 1) {
    return false
  }
  if (date.getUTCDate() !== day) {
    return false
  }
  return true
}
