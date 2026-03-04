import { wrapInRollbacks } from '@server/tests/utils/transactions/index.js'
import { createTestDatabase } from '@server/tests/utils/testDatabase.js'
import { createCallerFactory } from '@server/trpc/index.js'
import {
  authContext,
  requestContext,
} from '@server/tests/utils/context.js'
import { insertAll } from '@server/tests/utils/records.js'
import { fakeUser } from '@server/entities/test/fakes.js'
import { describe, it, expect } from 'vitest'
import householdRouter from '../index.js'

const db = await wrapInRollbacks(
  createTestDatabase()
)

const createCaller = createCallerFactory(
  householdRouter
)

const [user] = await insertAll(db, 'user', [
  fakeUser({
    email: 'tata@coco.com',
  }),
])

describe('Household Create Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { create } = createCaller(
      requestContext({ db })
    )

    await expect(
      create({ name: 'some name' })
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'Unauthenticated. Please log in',
      })
    )
  })

  const { create } = createCaller(
    authContext(
      { db },
      { id: user.id, email: user.email }
    )
  )

  it('should create a household in the database', async () => {
    await expect(
      create({ name: 'Santos-Simon' })
    ).resolves.toStrictEqual(
      expect.objectContaining({
        name: 'Santos-Simon',
      })
    )
  })

  it('should create a household with a profile picture', async () => {
    await expect(
      create({
        name: 'Santos-Simon',
        profilePicture: 'http://someurl.com',
      })
    ).resolves.toStrictEqual(
      expect.objectContaining({
        name: 'Santos-Simon',
        profilePicture: 'http://someurl.com',
      })
    )
  })

  it('should throw if the name is not valid', async () => {
    await expect(
      create({ name: 1312 as any })
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'BAD_REQUEST',
        name: 'TRPCError',
      })
    )
  })
})
