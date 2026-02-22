import { wrapInRollbacks } from '@server/tests/utils/transactions'
import { createTestDatabase } from '@server/tests/utils/testDatabase'
import { createCallerFactory } from '@server/trpc'
import ingredientRouter from '@server/controllers/ingredient'
import { insertAll } from '@server/tests/utils/records'
import {
  fakeHousehold,
  fakeIngredient,
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
    quantity: 1,
    unit: 'unit',
  }),
  fakeIngredient({
    householdId: household.id,
    unit: 'grams',
    quantity: 80,
  }),
  fakeIngredient({
    householdId: household.id,
    unit: 'ml',
    quantity: 90,
  }),
  fakeIngredient({
    householdId: household.id,
    unit: 'ml',
    quantity: 180,
  }),
  fakeIngredient({
    householdId: household.id,
    unit: 'unit',
    quantity: 3,
  }),
  fakeIngredient({
    householdId: household.id,
    unit: 'grams',
    quantity: 150,
  }),
])

describe('Ingredient Low Stock Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { getLowStock } = createCaller(
      requestContext({ db })
    )

    await expect(getLowStock()).rejects.toThrow(
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

    const { getLowStock } = createCaller(
      authContext(
        { db },
        {
          id: otherUser.id,
          email: otherUser.email,
        }
      )
    )

    await expect(getLowStock()).rejects.toThrow(
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

    const { getLowStock } = createCaller(
      authContext(
        { db },
        {
          id: outsideUser.id,
          email: outsideUser.email,
        },
        { id: household.id }
      )
    )

    await expect(getLowStock()).rejects.toThrow(
      expect.objectContaining({
        message:
          "You're not part of this household",
        code: 'BAD_REQUEST',
        name: 'TRPCError',
      })
    )
  })

  it('should throw if there is no record in the database for the householdId', async () => {
    const { getLowStock } = createCaller(
      authContext(
        { db },
        {
          id: user.id,
          email: user.email,
        },
        { id: 1312 }
      )
    )

    await expect(getLowStock()).rejects.toThrow(
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

    const { getLowStock } = createCaller(
      authContext(
        { db },
        {
          id: guestUser.id,
          email: guestUser.email,
        },
        { id: household.id }
      )
    )

    await expect(getLowStock()).rejects.toThrow(
      expect.objectContaining({
        code: 'BAD_REQUEST',
        name: 'TRPCError',
        message:
          "You're only a guest in this household",
      })
    )
  })

  it('should return an empty array if there is no record in the database for the stock', async () => {
    await insertAll(db, 'member', [
      fakeMember({
        householdId: secondHousehold.id,
        userId: user.id,
        roleId: 2,
      }),
    ])

    const { getLowStock } = createCaller(
      authContext(
        { db },
        {
          id: user.id,
          email: user.email,
        },
        { id: secondHousehold.id }
      )
    )

    const result = await getLowStock()

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  const { getLowStock } = createCaller(
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

  it('should get a collection of low stock ingredients correctly', async () => {
    const result = await getLowStock()

    expect(result).toBeDefined()
    expect(result).toHaveLength(3)
  })
})
