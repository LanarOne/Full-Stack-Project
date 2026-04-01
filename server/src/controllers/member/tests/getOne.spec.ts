import { wrapInRollbacks } from '@server/tests/utils/transactions/index.js'
import { createTestDatabase } from '@server/tests/utils/testDatabase.js'
import { createCallerFactory } from '@server/trpc/index.js'
import { insertAll } from '@server/tests/utils/records.js'
import {
  fakeHousehold,
  fakeMember,
  fakeUser,
} from '@server/entities/test/fakes.js'
import { describe, it, expect } from 'vitest'
import {
  authContext,
  requestContext,
} from '@server/tests/utils/context.js'
import memberRouter from '../index.js'

const db = await wrapInRollbacks(
  createTestDatabase()
)

const createCaller =
  createCallerFactory(memberRouter)

const [household] = await insertAll(
  db,
  'household',
  [fakeHousehold()]
)

const [user] = await insertAll(db, 'user', [
  fakeUser(),
])

await insertAll(db, 'member', [
  fakeMember({
    householdId: household.id,
    userId: user.id,
    roleId: 1,
  }),
])

describe('Member Get One Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { getOne } = createCaller(
      requestContext({ db })
    )

    await expect(
      getOne({
        householdId: household.id,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'Unauthenticated. Please log in',
        code: 'UNAUTHORIZED',
        name: 'TRPCError',
      })
    )
  })

  it('should throw if there is no record in the database for the householdId', async () => {
    const { getOne } = createCaller(
      authContext(
        { db },
        { id: user.id, email: user.email }
      )
    )

    await expect(
      getOne({ householdId: 1312 })
    ).rejects.toThrow(
      expect.objectContaining({
        message:
          'No matching record found in the database',
        code: 'NOT_FOUND',
        name: 'TRPCError',
      })
    )
  })

  it('should throw if the householdId is not valid', async () => {
    const { getOne } = createCaller(
      authContext(
        { db },
        { id: user.id, email: user.email }
      )
    )

    await expect(
      getOne({ householdId: 'notAnId' as any })
    ).rejects.toThrow(
      expect.objectContaining({
        message: expect.objectContaining(
          /Expected number, received string/i
        ),
        code: 'BAD_REQUEST',
        name: 'TRPCError',
      })
    )
  })

  const { getOne } = createCaller(
    authContext(
      { db },
      { id: user.id, email: user.email }
    )
  )

  it('should throw if the input has too many fields', async () => {
    await expect(
      getOne({
        householdId: household.id,
        newField: 'malevolent hack',
      } as any)
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'BAD_REQUEST',
        message: expect.objectContaining(
          /unrecognized_keys/i
        ),
        name: 'TRPCError',
      })
    )
  })

  it('should find a member correctly', async () => {
    await expect(
      getOne({ householdId: household.id })
    ).resolves.toEqual(
      expect.objectContaining({
        result: {
          userId: user.id,
          householdId: household.id,
          roleId: 1,
        },
      })
    )
  })
})
