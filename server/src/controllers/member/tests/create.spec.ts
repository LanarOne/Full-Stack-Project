import { wrapInRollbacks } from '@server/tests/utils/transactions'
import { createTestDatabase } from '@server/tests/utils/testDatabase'
import { createCallerFactory } from '@server/trpc'
import memberRouter from '..'
import { insertAll } from '@server/tests/utils/records'
import {
  fakeHousehold,
  fakeMember,
  fakeUser,
} from '@server/entities/test/fakes'
import { describe, it, expect } from 'vitest'
import {
  authContext,
  requestContext,
} from '@server/tests/utils/context'

const db = await wrapInRollbacks(
  createTestDatabase()
)

const createCaller =
  createCallerFactory(memberRouter)

const [household, secondHousehold] =
  await insertAll(db, 'household', [
    fakeHousehold(),
    fakeHousehold(),
  ])

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
])

describe('Member Create Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { create } = createCaller(
      requestContext({ db })
    )

    await expect(
      create({
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
    const { create } = createCaller(
      authContext(
        { db },
        {
          id: chiefUser.id,
          email: chiefUser.email,
        }
      )
    )

    await expect(
      create({
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

  it('should throw if the user is not in the household', async () => {
    const [outsideUser] = await insertAll(
      db,
      'user',
      [fakeUser()]
    )

    const { create } = createCaller(
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
      create({ userId: guestUser.id })
    ).rejects.toThrow(
      expect.objectContaining({
        message:
          "You're not part of this household",
        code: 'BAD_REQUEST',
        name: 'TRPCError',
      })
    )
  })

  it('should throw if a guest tries to add a member', async () => {
    const [anotherUser] = await insertAll(
      db,
      'user',
      [fakeUser()]
    )
    await insertAll(db, 'member', [
      fakeMember({
        householdId: household.id,
        userId: anotherUser.id,
        roleId: 3,
      }),
    ])

    const { create } = createCaller(
      authContext(
        { db },
        {
          id: anotherUser.id,
          email: anotherUser.email,
        },
        { id: household.id }
      )
    )

    await expect(
      create({ userId: guestUser.id })
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'BAD_REQUEST',
        name: 'TRPCError',
        message:
          "You're only a guest in this household",
      })
    )
  })

  it('should throw if there is no record in the database for the householdId', async () => {
    const { create } = createCaller(
      authContext(
        { db },
        {
          id: chiefUser.id,
          email: chiefUser.email,
        },
        { id: 1312 }
      )
    )

    await expect(
      create({
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

  const { create } = createCaller(
    authContext(
      { db },
      {
        id: chiefUser.id,
        email: chiefUser.email,
      },
      {
        id: household.id,
      }
    )
  )

  it('should create a member correctly', async () => {
    await expect(
      create({ userId: guestUser.id })
    ).resolves.toEqual(
      expect.objectContaining({
        householdId: household.id,
        userId: guestUser.id,
        roleId: 3,
      })
    )
  })

  it('should throw if the user tries to add himself', async () => {
    await expect(
      create({ userId: chiefUser.id })
    ).rejects.toThrow(
      expect.objectContaining({
        message:
          'You cannot add yourself to your own household',
        code: 'BAD_REQUEST',
      })
    )
  })

  it('should throw if there is no record in the database for the userId', async () => {
    await expect(
      create({ userId: 1312 })
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
      create({
        userId: 'notAnID' as any,
      })
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

  it('should throw if the input has too many fields', async () => {
    await expect(
      create({
        userId: guestUser.id,
        newField: 'malevolent hack',
      } as any)
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'BAD_REQUEST',
        name: 'TRPCError',
        message: expect.objectContaining(
          /unrecognized_keys/i
        ),
      })
    )
  })
})
