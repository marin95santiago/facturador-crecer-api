import { Entity } from 'domain/entities/Entity.entity'

export interface EntityRepository {
  save: (entity: Entity) => Promise<Entity>
  getById: (id: string) => Promise<Entity | null>
  getByDocument: (document: string) => Promise<Entity | null>
  update: (entity: Entity) => Promise<Entity>
  delete: (id: string) => Promise<void>
}
