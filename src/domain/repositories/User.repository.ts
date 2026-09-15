import { User } from 'domain/entities/User.entity'

export interface UserRepository {
  getAll: () => Promise<User[]>
  save: (user: User) => Promise<User>
  getByEmail: (email: string) => Promise<User | null>
  update: (user: User) => Promise<User | null>
  delete: (id: string) => Promise<void>
  deleteByEntityId: (entityId: string) => Promise<number>
  getById: (id: string) => Promise<User | null>
}
