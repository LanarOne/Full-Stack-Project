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

describe('Member Change Role Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { changeHouseholdRole } = createCaller(
      requestContext({ db })
    )

    await expect(
      changeHouseholdRole({
        userId: guestUser.id,
        roleId: 2,
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
    const { changeHouseholdRole } = createCaller(
      authContext(
        { db },
        {
          id: chiefUser.id,
          email: chiefUser.email,
        }
      )
    )

    await expect(
      changeHouseholdRole({
        userId: guestUser.id,
        roleId: 2,
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

  it('should throw if the user is not in the household', async () => {
    const [outsideUser] = await insertAll(
      db,
      'user',
      [fakeUser()]
    )

    const { changeHouseholdRole } = createCaller(
      authContext(
        { db },
        {
          id: outsideUser.id,
          email: outsideUser.email,
        },
        { id: household.id }
      )
    )

    await expect(
      changeHouseholdRole({
        userId: guestUser.id,
        roleId: 2,
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

  it('should throw if someone other than the chief tries to modify the role', async () => {
    const [secondUser] = await insertAll(
      db,
      'user',
      [fakeUser()]
    )
    await insertAll(db, 'member', [
      fakeMember({
        householdId: household.id,
        userId: secondUser.id,
        roleId: 2,
      }),
    ])

    const { changeHouseholdRole } = createCaller(
      authContext(
        { db },
        {
          id: secondUser.id,
          email: secondUser.email,
        },
        { id: household.id }
      )
    )

    await expect(
      changeHouseholdRole({
        userId: guestUser.id,
        roleId: 2,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message:
          "You're not chief of this household",
        code: 'BAD_REQUEST',
        name: 'TRPCError',
      })
    )
  })

  const { changeHouseholdRole } = createCaller(
    authContext(
      { db },
      {
        id: chiefUser.id,
        email: chiefUser.email,
      },
      { id: household.id }
    )
  )

  it('should throw if the chief is trying to change its own roleId', async () => {
    await expect(
      changeHouseholdRole({
        userId: chiefUser.id,
        roleId: 3,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message:
          'You cannot modify your own role',
        code: 'BAD_REQUEST',
        name: 'TRPCError',
      })
    )
  })

  it('should throw if the user is not in the household', async () => {
    const [newUser] = await insertAll(
      db,
      'user',
      [fakeUser()]
    )

    await expect(
      changeHouseholdRole({
        userId: newUser.id,
        roleId: 2,
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

  it('should throw if the input has too many fields', async () => {
    await expect(
      changeHouseholdRole({
        userId: guestUser.id,
        roleId: 2,
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

  it('should throw if no record was found in the database for the roleId', async () => {
    await expect(
      changeHouseholdRole({
        userId: guestUser.id,
        roleId: 4,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message:
          'No matching record found in the database',
        code: 'NOT_FOUND',
        name: 'TRPCError',
      })
    )
  })

  it('should throw if the userId is not valid', async () => {
    await expect(
      changeHouseholdRole({
        userId: 'notAnId' as any,
        roleId: 2,
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
      changeHouseholdRole({
        userId: 1312,
        roleId: 2,
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

  it('should throw if the roleId is not valid', async () => {
    await expect(
      changeHouseholdRole({
        userId: guestUser.id,
        roleId: 'notAnId' as any,
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

  it('should change a role for a member correctly', async () => {
    await expect(
      changeHouseholdRole({
        userId: guestUser.id,
        roleId: 2,
      })
    ).resolves.toEqual(
      expect.objectContaining({
        userId: guestUser.id,
        householdId: household.id,
        roleId: 2,
      })
    )
  })
})
