import { wrapInRollbacks } from '@server/tests/utils/transactions'
import { createTestDatabase } from '@server/tests/utils/testDatabase'
import { createCallerFactory } from '@server/trpc'
import mealRouter from '@server/controllers/meal'
import { insertAll } from '@server/tests/utils/records'
import {
  fakeHomeMeal,
  fakeHousehold,
  fakeMember,
  fakeOutsideMeal,
  fakeRecipe,
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

const createCaller =
  createCallerFactory(mealRouter)

const [householdOne, householdTwo] =
  await insertAll(db, 'household', [
    fakeHousehold(),
    fakeHousehold(),
  ])

const [user] = await insertAll(db, 'user', [
  fakeUser(),
])

await insertAll(db, 'member', [
  fakeMember({
    householdId: householdOne.id,
    userId: user.id,
    roleId: 2,
  }),
])

const [recipe] = await insertAll(db, 'recipe', [
  fakeRecipe({ householdId: householdOne.id }),
])

await insertAll(db, 'meal', [
  fakeHomeMeal({
    householdId: householdOne.id,
    recipeId: recipe.id,
    eatingDate: someDaysAgo(),
  }),
  fakeHomeMeal({
    householdId: householdOne.id,
    recipeId: recipe.id,
    eatingDate: longExpiryDate(),
  }),
  fakeOutsideMeal({
    householdId: householdOne.id,
    outsideMeal: 'Fufu',
    eatingDate: someDaysAgo(),
  }),
  fakeOutsideMeal({
    householdId: householdOne.id,
    outsideMeal: 'Fufu',
    eatingDate: longExpiryDate(),
  }),
  fakeHomeMeal({
    householdId: householdTwo.id,
    recipeId: recipe.id,
    eatingDate: someDaysAgo(),
  }),
])

describe('Meal Get All Future Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { getFutureMeals } = createCaller(
      requestContext({ db })
    )

    await expect(
      getFutureMeals()
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

    const { getFutureMeals } = createCaller(
      authContext(
        { db },
        {
          id: otherUser.id,
          email: otherUser.email,
        }
      )
    )

    await expect(
      getFutureMeals()
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

    const { getFutureMeals } = createCaller(
      authContext(
        { db },
        {
          id: outsideUser.id,
          email: outsideUser.email,
        },
        { id: householdOne.id }
      )
    )

    await expect(
      getFutureMeals()
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
        householdId: householdOne.id,
        userId: guestUser.id,
        roleId: 3,
      }),
    ])

    const { getFutureMeals } = createCaller(
      authContext(
        { db },
        {
          id: guestUser.id,
          email: guestUser.email,
        },
        {
          id: householdOne.id,
        }
      )
    )

    await expect(
      getFutureMeals()
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
    const { getFutureMeals } = createCaller(
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
      getFutureMeals()
    ).rejects.toThrow(
      expect.objectContaining({
        message:
          "You're not part of this household",
        code: 'BAD_REQUEST',
        name: 'TRPCError',
      })
    )
  })

  const { getFutureMeals } = createCaller(
    authContext(
      { db },
      {
        id: user.id,
        email: user.email,
      },
      {
        id: householdOne.id,
      }
    )
  )

  it('should get a collection of all future meals correctly', async () => {
    await expect(
      getFutureMeals()
    ).resolves.toHaveLength(2)
  })
})
