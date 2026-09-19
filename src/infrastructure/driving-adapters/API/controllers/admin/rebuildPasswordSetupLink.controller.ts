import { NextFunction, Request, Response } from 'express'
import { RebuildPasswordSetupLinkUseCase } from '../../../../../application/useCases/RebuildPasswordSetupLink'
import { DynamoDBUserRepository } from '../../../../implementations/AWS/dynamoDB/DynamoDBUserRepository'

/** Rebuilds a password setup link for an existing user using the admin API key. */
export const rebuildPasswordSetupLink = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email } = req.params
  const secret = process.env.SECRET ?? ''
  const frontUrl = process.env.FRONT_URL ?? 'http://localhost:3000'
  const userRepository = new DynamoDBUserRepository()
  const rebuildPasswordSetupLinkUseCase = new RebuildPasswordSetupLinkUseCase(userRepository)

  try {
    const result = await rebuildPasswordSetupLinkUseCase.run(email, secret, frontUrl)
    res.json(result)
  } catch (error) {
    next(error)
  }
}
