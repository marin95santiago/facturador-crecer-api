import { EntityNotFoundException } from '../../../domain/exceptions/entity/EntityNotFound.exception'
import { AuthTokenRepository } from '../../../domain/repositories/AuthToken.repository'
import { ElectronicBillRepository } from '../../../domain/repositories/ElectronicBill.repository'
import { EntityRepository } from '../../../domain/repositories/Entity.repository'
import { ItemRepository } from '../../../domain/repositories/Item.repository'
import { ScheduleRepository } from '../../../domain/repositories/Schedule.repository'
import { ThirdRepository } from '../../../domain/repositories/Third.repository'
import { UserRepository } from '../../../domain/repositories/User.repository'

export interface EntityCascadeDeleteResult {
  entityId: string
  deleted: {
    users: number
    thirds: number
    items: number
    electronicBills: number
    schedules: number
    authTokens: number
    entity: number
  }
}

export class EntityCascadeDeleterUseCase {
  private readonly _entityRepository: EntityRepository
  private readonly _userRepository: UserRepository
  private readonly _thirdRepository: ThirdRepository
  private readonly _itemRepository: ItemRepository
  private readonly _electronicBillRepository: ElectronicBillRepository
  private readonly _scheduleRepository: ScheduleRepository
  private readonly _authTokenRepository: AuthTokenRepository

  constructor (
    entityRepository: EntityRepository,
    userRepository: UserRepository,
    thirdRepository: ThirdRepository,
    itemRepository: ItemRepository,
    electronicBillRepository: ElectronicBillRepository,
    scheduleRepository: ScheduleRepository,
    authTokenRepository: AuthTokenRepository
  ) {
    this._entityRepository = entityRepository
    this._userRepository = userRepository
    this._thirdRepository = thirdRepository
    this._itemRepository = itemRepository
    this._electronicBillRepository = electronicBillRepository
    this._scheduleRepository = scheduleRepository
    this._authTokenRepository = authTokenRepository
  }

  /** Deletes an entity and all related DynamoDB records. */
  async run (entityId: string): Promise<EntityCascadeDeleteResult> {
    const entity = await this._entityRepository.getById(entityId)

    if (entity === null) {
      throw new EntityNotFoundException()
    }

    const usersDeleted = await this._userRepository.deleteByEntityId(entityId)
    const thirdsDeleted = await this._thirdRepository.deleteByEntityId(entityId)
    const itemsDeleted = await this._itemRepository.deleteByEntityId(entityId)
    const electronicBillsDeleted = await this._electronicBillRepository.deleteByEntityId(entityId)
    const schedulesDeleted = await this._scheduleRepository.deleteByEntityId(entityId)
    const authTokensDeleted = await this._authTokenRepository.deleteByEntityId(entityId)

    await this._entityRepository.delete(entityId)

    return {
      entityId,
      deleted: {
        users: usersDeleted,
        thirds: thirdsDeleted,
        items: itemsDeleted,
        electronicBills: electronicBillsDeleted,
        schedules: schedulesDeleted,
        authTokens: authTokensDeleted,
        entity: 1
      }
    }
  }
}
