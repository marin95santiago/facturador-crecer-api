import { Item } from 'domain/entities/Item.entity'

export interface ItemRepository {
  getAll: (entityId: string, limit?: number, lastEvaluatedKey?: any) => Promise<{lastEvaluatedKey: any, items: Item[]}>
  save: (item: Item) => Promise<Item>
  getByCode: (code: string, entityId: string) => Promise<Item | null>
  update: (item: Item) => Promise<Item>
  deleteByEntityId: (entityId: string) => Promise<number>
}
