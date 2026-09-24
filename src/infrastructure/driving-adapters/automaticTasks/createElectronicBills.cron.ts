import cron from 'node-cron'
import fs from 'fs'
import { DynamoDBEntityRepository } from '../../../infrastructure/implementations/AWS/dynamoDB/DynamoDBEntityRepository'
import { DynamoDBScheduleRepository } from '../../../infrastructure/implementations/AWS/dynamoDB/DynamoDBScheduleRepository'
import { DynamoDBElectronicBillRepository } from '../../../infrastructure/implementations/AWS/dynamoDB/DynamoDBElectronicBillRepository'
import { ScheduleExecutorUseCase } from '../../../application/useCases/ScheduleExecutor'
import { getAppTimezone } from '../../../domain/services/utils/date.helper'

// Define the task to be executed
const task = cron.schedule('00 02 * * *', async () => {
  console.log('Running scheduled bills generator')
  await handler()
}, {
  scheduled: true,
  timezone: getAppTimezone()
})


async function handler() {
  const dynamoDBScheduleRepository = new DynamoDBScheduleRepository()
  const dynamoDBElectronicBillRepository = new DynamoDBElectronicBillRepository()
  const dynamoDBEntityRepository = new DynamoDBEntityRepository()
  const scheduleExecutorUseCase = new ScheduleExecutorUseCase(dynamoDBScheduleRepository, dynamoDBElectronicBillRepository, dynamoDBEntityRepository)

  try {
    const actions = await scheduleExecutorUseCase.run()
    if (actions && actions.length > 0) {
      const date = new Date()
      const epochTime = date.toDateString()
      const filename = epochTime
      fs.writeFile(`./logs/${filename}`, JSON.stringify(actions), (err) => {
        if (err) {
          console.error('Error in write output schedule actions:', err)
        }
      })
    }
    console.log('Schedule process ended', actions)
  } catch (error) {
    console.log(error)
  }

  return
}

// Start the cron job
task.start()

console.log(`Cron job for scheduled bills is runing every day at 2 AM in the timezone ${getAppTimezone()}`)
