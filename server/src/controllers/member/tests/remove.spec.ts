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

const [chiefUser, guestUser] = await insertAll(
  db,
  'user',
  [fakeUser(), fakeUser()]
)

await insertAll(db, 'member', [
  fakeMember({
    userId: chiefUser.id,
    householdId: household.id,
    roleId: 1,
  }),
  fakeMember({
    userId: guestUser.id,
    householdId: household.id,
    roleId: 3,
  }),
])

describe('Member Delete Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { remove } = createCaller(
      requestContext({ db })
    )

    await expect(
      remove({
        userId: guestUser.id,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'Unauthenticated. Please log in',
        code: 'UNAUTHORIZED',
        name: 'TRPCError',
      })
    )
  })

  it('should throw if the user is logged in but not in the household', async () => {
    const { remove } = createCaller(
      authContext(
        { db },
        {
          id: chiefUser.id,
          email: chiefUser.email,
        }
      )
    )

    await expect(
      remove({
        userId: guestUser.id,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message:
          "You're not part of this household",
        code: 'BAD_REQUEST',
        name: 'TRPCError',
      })
    )
  })

  const { remove } = createCaller(
    authContext(
      { db },
      {
        id: chiefUser.id,
        email: chiefUser.email,
      },
      { id: household.id }
    )
  )

  it('should throw if the user is not in the household', async () => {
    const [newUser] = await insertAll(
      db,
      'user',
      [fakeUser()]
    )

    await expect(
      remove({
        userId: newUser.id,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'NOT_FOUND',
        message:
          'No matching record found in the database',
      })
    )
  })

  it('should throw if there are too many fields to the request', async () => {
    await expect(
      remove({
        userId: guestUser.id,
        householdId: household.id,
      } as any)
    ).rejects.toThrow(
      expect.objectContaining({
        message: expect.objectContaining(
          /unrecognized_keys/i
        ),
        code: 'BAD_REQUEST',
        name: 'TRPCError',
      })
    )
  })

  it('should throw if the userId is not valid', async () => {
    await expect(
      remove({
        userId: 'notAnId' as any,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message:
          expect.objectContaining(
            /invalid_type/i
          ),
        code: 'BAD_REQUEST',
        name: 'TRPCError',
      })
    )
  })

  it('should throw if there is no record in the database for the userId', async () => {
    await expect(
      remove({
        userId: 1312,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'NOT_FOUND',
        message:
          'No matching record found in the database',
        name: 'TRPCError',
      })
    )
  })

  it('should delete a member correctly when logged as chief', async () => {
    await expect(
      remove({
        userId: guestUser.id,
      })
    ).resolves.toEqual(
      expect.objectContaining({
        userId: guestUser.id,
        householdId: household.id,
      })
    )
  })
})
