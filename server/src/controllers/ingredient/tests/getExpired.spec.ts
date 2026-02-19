import { wrapInRollbacks } from '@server/tests/utils/transactions'
import { createTestDatabase } from '@server/tests/utils/testDatabase'
import { createCallerFactory } from '@server/trpc'
import ingredientRouter from '@server/controllers/ingredient'
import { insertAll } from '@server/tests/utils/records'
import {
  aWeekAgo,
  closeExpiryDate,
  fakeHousehold,
  fakeIngredient,
  fakeMember,
  fakeUser,
  longExpiryDate,
  someDaysAgo,
} from '@server/entities/test/fakes'
import { describe, it, expect } from 'vitest'
import {
  authContext,
  requestContext,
} from '@server/tests/utils/context'

const db = await wrapInRollbacks(
  createTestDatabase()
)

const createCaller = createCallerFactory(
  ingredientRouter
)

const [household, secondHousehold] =
  await insertAll(db, 'household', [
    fakeHousehold(),
    fakeHousehold(),
  ])

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

await insertAll(db, 'ingredient', [
  fakeIngredient({
    householdId: household.id,
    expiryDate: aWeekAgo(),
  }),
  fakeIngredient({
    householdId: household.id,
    expiryDate: someDaysAgo(),
  }),
  fakeIngredient({
    householdId: household.id,
    expiryDate: aWeekAgo(),
  }),
  fakeIngredient({
    householdId: household.id,
    expiryDate: closeExpiryDate(),
  }),
  fakeIngredient({
    householdId: household.id,
    expiryDate: longExpiryDate(),
  }),
  fakeIngredient({
    householdId: household.id,
    expiryDate: closeExpiryDate(),
  }),
])

describe('Ingredient Get By Passed Expiry Date Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { getExpired } = createCaller(
      requestContext({ db })
    )

    await expect(getExpired()).rejects.toThrow(
      expect.objectContaining({
        message: 'Unauthenticated. Please log in',
        code: 'UNAUTHORIZED',
        name: 'TRPCError',
      })
    )
  })

  it('should throw if the user is logged in but not in the household', async () => {
    const [otherUser] = await insertAll(
      db,
      'user',
      [fakeUser()]
    )

    const { getExpired } = createCaller(
      authContext(
        { db },
        {
          id: otherUser.id,
          email: otherUser.email,
        }
      )
    )

    await expect(getExpired()).rejects.toThrow(
      expect.objectContaining({
        message: expect.objectContaining(
          /unrecognized_keys/i
        ),
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

    const { getExpired } = createCaller(
      authContext(
        { db },
        {
          id: outsideUser.id,
          email: outsideUser.email,
        },
        { id: household.id }
      )
    )

    await expect(getExpired()).rejects.toThrow(
      expect.objectContaining({
        message:
          "You're not part of this household",
        code: 'BAD_REQUEST',
        name: 'TRPCError',
      })
    )
  })

  it('should throw if there is no record in the database for the householdId', async () => {
    const { getExpired } = createCaller(
      authContext(
        { db },
        {
          id: user.id,
          email: user.email,
        },
        { id: 1312 }
      )
    )

    await expect(getExpired()).rejects.toThrow(
      expect.objectContaining({
        code: 'BAD_REQUEST',
        name: 'TRPCError',
        message:
          "You're not part of this household",
      })
    )
  })

  it('should throw if the user is a guest in the household', async () => {
    const [guestUser] = await insertAll(
      db,
      'user',
      [fakeUser()]
    )
    await insertAll(db, 'member', [
      fakeMember({
        householdId: household.id,
        userId: guestUser.id,
        roleId: 3,
      }),
    ])

    const { getExpired } = createCaller(
      authContext(
        { db },
        {
          id: guestUser.id,
          email: guestUser.email,
        },
        { id: household.id }
      )
    )

    await expect(getExpired()).rejects.toThrow(
      expect.objectContaining({
        code: 'BAD_REQUEST',
        name: 'TRPCError',
        message:
          "You're only a guest in this household",
      })
    )
  })

  it('should return an empty array if there is no record in the database for the type', async () => {
    await insertAll(db, 'member', [
      fakeMember({
        householdId: secondHousehold.id,
        userId: user.id,
        roleId: 2,
      }),
    ])

    const { getExpired } = createCaller(
      authContext(
        { db },
        {
          id: user.id,
          email: user.email,
        },
        { id: secondHousehold.id }
      )
    )

    const result = await getExpired()

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  const { getExpired } = createCaller(
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

  it('should get a collection of expired ingredients correctly', async () => {
    const result = await getExpired()

    expect(result).toBeDefined()
    expect(result).toHaveLength(3)
  })
})
