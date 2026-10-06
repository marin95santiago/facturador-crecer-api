import { NextFunction, Request, Response } from 'express'
import { DynamoDBElectronicBillRepository } from '../../../../implementations/AWS/dynamoDB/DynamoDBElectronicBillRepository'
import { DynamoDBEntityRepository } from '../../../../implementations/AWS/dynamoDB/DynamoDBEntityRepository'
import { DynamoDBScheduleRepository } from '../../../../implementations/AWS/dynamoDB/DynamoDBScheduleRepository'
import { DynamoDBSubscriptionRepository } from '../../../../implementations/AWS/dynamoDB/DynamoDBSubscriptionRepository'
import { ElectronicBillCreatorUseCase  } from '../../../../../application/useCases/ElectronicBillCreator'
import { validatePermission } from '../../utils'
import permissionsList from '../../permission.json'
import { PermissionNotAvailableException } from '../../../../../domain/exceptions/common/PermissionNotAvailable.exception'
import { ScheduleCreatorUseCase } from '../../../../../application/useCases/ScheduleCreator'
import { v4 as uuidv4 } from 'uuid'

export const createElectronicBill = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const {
    date,
    orderReference,
    third,
    wayToPay,
    paymentMethod,
    paymentDueDate,
    municipality,
    note,
    items,
    taxes,
    total,
    totalTaxes,
    totalToPay,
    scheduleForm
  } = req.body

  const { sessionUser } = req.params

  const dynamoDBElectronicBillRepository = new DynamoDBElectronicBillRepository()
  const dynamoDBEntityRepository = new DynamoDBEntityRepository()
  const dynamoDBScheduleRepository = new DynamoDBScheduleRepository()
  const electronicBillCreatorUseCase = new ElectronicBillCreatorUseCase (dynamoDBElectronicBillRepository, dynamoDBEntityRepository, new DynamoDBSubscriptionRepository())
  const scheduleCreator = new ScheduleCreatorUseCase(dynamoDBScheduleRepository)

  try {
    const session = JSON.parse(sessionUser)
    const doesSuperAdminHavePermission = true
    const havePermission = validatePermission(permissionsList.electronic_bill.create, session.data.user.permissions, doesSuperAdminHavePermission)
    if (!havePermission) throw new PermissionNotAvailableException()

    const billCreated = await electronicBillCreatorUseCase.run({
      entityId: session.data.user.entityId,
      userId: session.data.user.id,
      date,
      orderReference,
      third,
      wayToPay,
      paymentMethod,
      paymentDueDate,
      municipality,
      note,
      items,
      taxes,
      total,
      totalTaxes,
      totalToPay
    })

    if (scheduleForm) {
      const havePermission = validatePermission(permissionsList.electronic_bill.schedule_create, session.data.user.permissions, doesSuperAdminHavePermission)
      if (!havePermission) throw new PermissionNotAvailableException()

      await scheduleCreator.run({
        entityId: session.data.user.entityId,
        userId: session.data.user.id,
        code: uuidv4(),
        name: scheduleForm.name,
        startDate: scheduleForm.startDate,
        endDate: scheduleForm.endDate,
        intervalDays: scheduleForm.intervalDays,
        idForm: billCreated.data.number?.toString() ?? '',
        entity: 'ElectronicBill'
      }) 
      
    }

    res.json(billCreated)
  } catch (error) {
    return next(error)
  }
}
