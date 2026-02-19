import { wrapInRollbacks } from '@server/tests/utils/transactions'
import { createTestDatabase } from '@server/tests/utils/testDatabase'
import { createCallerFactory } from '@server/trpc'
import leftoverRouter from '@server/controllers/leftover'
import { insertAll } from '@server/tests/utils/records'
import {
  fakeHomeMeal,
  fakeHousehold,
  fakeLeftover,
  fakeMember,
  fakeOutsideMeal,
  fakeRecipe,
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
  leftoverRouter
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
  }),
])

const [recipe] = await insertAll(db, 'recipe', [
  fakeRecipe({ householdId: household.id }),
])

const [homeMeal, outsideMeal] = await insertAll(
  db,
  'meal',
  [
    fakeHomeMeal({
      householdId: household.id,
      recipeId: recipe.id,
    }),
    fakeOutsideMeal({
      householdId: household.id,
      outsideMeal: "Joe's Pizza",
    }),
  ]
)

await insertAll(db, 'leftover', [
  fakeLeftover({
    householdId: household.id,
    mealId: homeMeal.id,
  }),
  fakeLeftover({
    householdId: household.id,
    mealId: outsideMeal.id,
  }),
])

describe('Leftover Get By Household Controller', () => {
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

  it('should throw if the user is not in the household', async () => {
    const [outsideUser] = await insertAll(
      db,
      'user',
      [fakeUser()]
    )

    const { getByHouseholdId } = createCaller(
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
      getByHouseholdId()
    ).rejects.toThrow(
      expect.objectContaining({
        message:
          "You're not part of this household",
        code: 'BAD_REQUEST',
        name: 'TRPCError',
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

    const { getByHouseholdId } = createCaller(
      authContext(
        { db },
        {
          id: guestUser.id,
          email: guestUser.email,
        },
        {
          id: household.id,
        }
      )
    )

    await expect(
      getByHouseholdId()
    ).rejects.toThrow(
      expect.objectContaining({
        message:
          "You're only a guest in this household",
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
        message:
          "You're not part of this household",
        code: 'BAD_REQUEST',
        name: 'TRPCError',
      })
    )
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

  it('should get a leftover by householdId correctly', async () => {
    await expect(
      getByHouseholdId()
    ).resolves.toHaveLength(2)
  })
})
