import { wrapInRollbacks } from '@server/tests/utils/transactions/index.js'
import { createTestDatabase } from '@server/tests/utils/testDatabase.js'
import { createCallerFactory } from '@server/trpc/index.js'
import { describe, it, expect } from 'vitest'
import { insertAll } from '@server/tests/utils/records.js'
import {
  fakeHousehold,
  fakeMember,
  fakeUser,
} from '@server/entities/test/fakes.js'
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

describe('Household Update Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { update } = createCaller(
      requestContext({ db })
    )

    await expect(
      update({
        name: 'some name',
        profilePicture: 'http://url.url',
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'Unauthenticated. Please log in',
      })
    )
  })

  it('should throw if the user is logged in but not in the household', async () => {
    const { update } = createCaller(
      authContext(
        { db },
        { id: user.id, email: user.email }
      )
    )

    await expect(
      update({
        name: 'some name',
        profilePicture: 'http://url.url',
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

  it('should throw if there is no record in the database for the household', async () => {
    const { update } = createCaller(
      authContext(
        { db },
        { id: user.id, email: user.email },
        { id: 1312 }
      )
    )

    await expect(
      update({
        name: 'Lanar',
        profilePicture:
          'http://someprofilepic.com',
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

    const { update } = createCaller(
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
      update({ name: 'some name' })
    ).rejects.toThrow(
      expect.objectContaining({
        message:
          "You're not part of this household",
        code: 'BAD_REQUEST',
        name: 'TRPCError',
      })
    )
  })

  it('should throw if the user is not chief of the household', async () => {
    const [anotherUser] = await insertAll(
      db,
      'user',
      [fakeUser()]
    )
    await insertAll(db, 'member', [
      fakeMember({
        householdId: household.id,
        userId: anotherUser.id,
        roleId: 2,
      }),
    ])

    const { update } = createCaller(
      authContext(
        { db },
        {
          id: anotherUser.id,
          email: anotherUser.email,
        },
        {
          id: household.id,
        }
      )
    )

    await expect(
      update({
        name: 'Lanar',
        profilePicture:
          'http://someprofilepic.com',
      })
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'BAD_REQUEST',
        name: 'TRPCError',
        message:
          "You're not chief of this household",
      })
    )
  })

  const { update } = createCaller(
    authContext(
      { db },
      {
        id: user.id,
        email: user.email,
      },
      {
        id: household.id,
      }
    )
  )

  it('should throw if the fields are not properly formatted', async () => {
    await expect(
      update({
        name: 1312 as any,
        profilePicture: 'notAnURL',
      })
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'BAD_REQUEST',
        name: 'TRPCError',
        message:
          expect.objectContaining(/invalid_url/i),
      })
    )
  })

  it('should throw if input has fields that are not in the database', async () => {
    await expect(
      update({
        name: 'LanarOne',
        profilePicture: 'http://url.url',
        newField: 'malevolent hack',
      } as any)
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'BAD_REQUEST',
        name: 'TRPCError',
        message:
          expect.objectContaining(/invalid_url/i),
      })
    )
  })

  it('should update a household correctly', async () => {
    await expect(
      update({
        name: 'Lanar',
        profilePicture:
          'http://someprofilepic.com',
      })
    ).resolves.toEqual(
      expect.objectContaining({
        name: 'Lanar',
        profilePicture:
          'http://someprofilepic.com',
      })
    )
  })
})
