import { BatchWriteItemCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { marshall } from '@aws-sdk/util-dynamodb'

const BATCH_SIZE = 25

/** Deletes DynamoDB items in batches of 25 and returns the total deleted count. */
export async function batchDeleteItems (
  client: DynamoDBClient,
  tableName: string,
  keys: Record<string, unknown>[]
): Promise<number> {
  let deletedCount = 0

  for (let index = 0; index < keys.length; index += BATCH_SIZE) {
    const batchKeys = keys.slice(index, index + BATCH_SIZE)
    const deleteRequests = batchKeys.map((key) => ({
      DeleteRequest: {
        Key: marshall(key, { removeUndefinedValues: true })
      }
    }))

    await client.send(new BatchWriteItemCommand({
      RequestItems: {
        [tableName]: deleteRequests
      }
    }))

    deletedCount += batchKeys.length
  }

  return deletedCount
}
