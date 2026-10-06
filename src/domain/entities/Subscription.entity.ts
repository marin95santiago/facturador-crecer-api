export interface Subscription {
  id: string
  entityId: string
  maxDocuments: number
  currentDocuments: number
  active: boolean
  startDate: string
  endDate: string
  description: string
  createdAt: string
}
