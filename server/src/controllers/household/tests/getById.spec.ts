import { createTestDatabase } from '@server/tests/utils/testDatabase.js'
import { wrapInRollbacks } from '@server/tests/utils/transactions/index.js'
import { createCallerFactory } from '@server/trpc/index.js'
import { insertAll } from '@server/tests/utils/records.js'
import {
  fakeHousehold,
  fakeUser,
} from '@server/entities/test/fakes.js'
import { describe, it, expect } from 'vitest'
import {
  authContext,
  requestContext,
} from '@server/tests/utils/context.js'
import householdRouter from '../index.js'

const db = await wrapInRollbacks(
  createTestDatabase()
)

const createCaller = createCallerFactory(
  householdRouter
)

const [user] = await insertAll(db, 'user', [
  fakeUser({ email: 'toto@caca.com' }),
])

const [household] = await insertAll(
  db,
  'household',
  [fakeHousehold()]
)

describe('Household getById controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { getById } = createCaller(
      requestContext({ db })
    )

    await expect(
      getById({ id: household.id })
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'Unauthenticated. Please log in',
      })
    )
  })

  const { getById } = createCaller(
    authContext(
      { db },
      { id: user.id, email: user.email }
    )
  )

  it('should get a household by ID correctly', async () => {
    await expect(
      getById({ id: household.id })
    ).resolves.toEqual(
      expect.objectContaining({
        name: household.name,
        profilePicture: household.profilePicture,
      })
    )
  })

  it('should throw if there is no record for the householdId in the database', async () => {
    await expect(
      getById({ id: 1312 })
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'NOT_FOUND',
        name: 'TRPCError',
      })
    )
  })
})
