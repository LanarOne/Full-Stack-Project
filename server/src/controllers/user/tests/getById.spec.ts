import { createTestDatabase } from '@server/tests/utils/testDatabase.js'
import { wrapInRollbacks } from '@server/tests/utils/transactions/index.js'
import { createCallerFactory } from '@server/trpc/index.js'
import { insertAll } from '@server/tests/utils/records.js'
import { fakeUser } from '@server/entities/test/fakes.js'
import { describe, it, expect } from 'vitest'
import {
  authContext,
  requestContext,
} from '@server/tests/utils/context.js'
import userRouter from '../index.js'

const db = await wrapInRollbacks(
  createTestDatabase()
)

const createCaller =
  createCallerFactory(userRouter)

const [user] = await insertAll(db, 'user', [
  fakeUser({ email: 'random@email.com' }),
])

describe('User getById controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { getById } = createCaller(
      requestContext({ db })
    )

    await expect(getById()).rejects.toThrow(
      expect.objectContaining({
        message: 'Unauthenticated. Please log in',
      })
    )
  })

  it('should throw if there is no record for the userId in the database', async () => {
    const { getById } = createCaller(
      authContext(
        { db },
        { id: 1312, email: user.email }
      )
    )

    await expect(getById()).rejects.toThrow(
      expect.objectContaining({
        code: 'NOT_FOUND',
        name: 'TRPCError',
      })
    )
  })

  const { getById } = createCaller(
    authContext(
      { db },
      { id: user.id, email: user.email }
    )
  )

  it('should get a user by ID correctly', async () => {
    await expect(getById()).resolves.toEqual(
      expect.objectContaining({
        name: user.name,
        profilePicture: user.profilePicture,
      })
    )
  })
})
