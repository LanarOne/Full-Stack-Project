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
  }),
])

await insertAll(db, 'ingredient', [
  fakeIngredient({
    householdId: household.id,
    type: 'vegetable',
  }),
  fakeIngredient({
    householdId: household.id,
    type: 'vegetable',
  }),
  fakeIngredient({
    householdId: household.id,
    type: 'meat',
  }),
  fakeIngredient({
    householdId: household.id,
    type: 'fish',
  }),
  fakeIngredient({
    householdId: secondHousehold.id,
    type: 'vegetable',
  }),
  fakeIngredient({
    householdId: secondHousehold.id,
    type: 'fish',
  }),
])

describe('Ingredient Get By Household Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { getByHouseholdId } = createCaller(
      requestContext({ db })
    )

    await expect(
      getByHouseholdId()
    ).rejects.toThrow(
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

    const { getByHouseholdId } = createCaller(
      authContext(
        { db },
        {
          id: otherUser.id,
          email: otherUser.email,
        }
      )
    )

    await expect(
      getByHouseholdId()
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

  it('should throw if there is no record in the database for the householdId', async () => {
    const { getByHouseholdId } = createCaller(
      authContext(
        { db },
        {
          id: user.id,
          email: user.email,
        },
        { id: 1312 }
      )
    )
    await expect(
      getByHouseholdId()
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'BAD_REQUEST',
        name: 'TRPCError',
        message:
          "You're not part of this household",
      })
    )
  })

  it('should return an empty array if there is no record in the database for the household', async () => {
    const [emptyHousehold] = await insertAll(
      db,
      'household',
      [fakeHousehold()]
    )
    await insertAll(db, 'member', [
      fakeMember({
        userId: user.id,
        householdId: emptyHousehold.id,
      }),
    ])

    const { getByHouseholdId } = createCaller(
      authContext(
        { db },
        {
          id: user.id,
          email: user.email,
        },
        {
          id: emptyHousehold.id,
        }
      )
    )

    const result = await getByHouseholdId()

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  const { getByHouseholdId } = createCaller(
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

  it('should get a collection of ingredients by householdId correctly', async () => {
    const result = await getByHouseholdId()

    expect(result).toBeDefined()
    expect(result).toHaveLength(4)
  })
})
