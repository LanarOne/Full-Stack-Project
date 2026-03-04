import { wrapInRollbacks } from '@server/tests/utils/transactions/index.js'
import { createTestDatabase } from '@server/tests/utils/testDatabase.js'
import { createCallerFactory } from '@server/trpc/index.js'
import participantRouter from '@server/controllers/participant/index.js'
import { insertAll } from '@server/tests/utils/records.js'
import {
  fakeHomeMeal,
  fakeHousehold,
  fakeMember,
  fakeOutsideMeal,
  fakeParticipant,
  fakeRecipe,
  fakeUser,
} from '@server/entities/test/fakes.js'
import { describe, it, expect } from 'vitest'
import {
  authContext,
  requestContext,
} from '@server/tests/utils/context.js'

const db = await wrapInRollbacks(
  createTestDatabase()
)

const createCaller = createCallerFactory(
  participantRouter
)

const [household] = await insertAll(
  db,
  'household',
  [fakeHousehold()]
)

const [userOne, userTwo, userThree] =
  await insertAll(db, 'user', [
    fakeUser(),
    fakeUser(),
    fakeUser(),
  ])

await insertAll(db, 'member', [
  fakeMember({
    householdId: household.id,
    userId: userOne.id,
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
      outsideMeal: 'Kokomo',
    }),
  ]
)

await insertAll(db, 'participant', [
  fakeParticipant({
    mealId: homeMeal.id,
    userId: userOne.id,
  }),
  fakeParticipant({
    mealId: homeMeal.id,
    userId: userTwo.id,
  }),
  fakeParticipant({
    mealId: outsideMeal.id,
    userId: userThree.id,
  }),
])

describe('Participant Get By Meal ID Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { getByMealId } = createCaller(
      requestContext({ db })
    )

    await expect(
      getByMealId({
        mealId: homeMeal.id,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'Unauthenticated. Please log in',
        code: 'UNAUTHORIZED',
        name: 'TRPCError',
      })
    )
  })

  it('should throw if the user was not invited to the Meal', async () => {
    const [outsider] = await insertAll(
      db,
      'user',
      [fakeUser()]
    )

    const { getByMealId } = createCaller(
      authContext(
        { db },
        { id: outsider.id, email: outsider.email }
      )
    )

    await expect(
      getByMealId({
        mealId: homeMeal.id,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'FORBIDDEN',
        message:
          'You cannot access this information',
        name: 'TRPCError',
      })
    )
  })

  const { getByMealId } = createCaller(
    authContext(
      { db },
      {
        id: userOne.id,
        email: userOne.email,
      },
      {
        id: household.id,
      }
    )
  )

  it('should throw if there is no record in the database for the meal ID', async () => {
    await expect(
      getByMealId({ mealId: 1312 })
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'FORBIDDEN',
        message:
          'You cannot access this information',
        name: 'TRPCError',
      })
    )
  })

  it('should throw if the meal ID is not properly formatted', async () => {
    await expect(
      getByMealId({
        mealId: 'notAnId' as any,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'BAD_REQUEST',
        name: 'TRPCError',
        message:
          expect.objectContaining(
            /invalid_type/i
          ),
      })
    )
  })

  it('should throw if there are too many fields in the request', async () => {
    await expect(
      getByMealId({
        mealId: homeMeal.id,
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

  it('should get a collection of Participants to a Meal correctly', async () => {
    await expect(
      getByMealId({
        mealId: homeMeal.id,
      })
    ).resolves.toHaveLength(2)
  })
})
