import { wrapInRollbacks } from '@server/tests/utils/transactions'
import { createTestDatabase } from '@server/tests/utils/testDatabase'
import { createCallerFactory } from '@server/trpc'
import participantRouter from '@server/controllers/participant'
import { insertAll } from '@server/tests/utils/records'
import {
  fakeHomeMeal,
  fakeHousehold,
  fakeMember,
  fakeOutsideMeal,
  fakeParticipant,
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
  participantRouter
)

const [household] = await insertAll(
  db,
  'household',
  [fakeHousehold()]
)

const [userOne, userTwo] = await insertAll(
  db,
  'user',
  [fakeUser(), fakeUser()]
)

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
    userId: userOne.id,
  }),
])

describe('Participant Get By User ID Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { getByUserId } = createCaller(
      requestContext({ db })
    )

    await expect(getByUserId()).rejects.toThrow(
      expect.objectContaining({
        message: 'Unauthenticated. Please log in',
        code: 'UNAUTHORIZED',
        name: 'TRPCError',
      })
    )
  })

  it('should return an empty array if no record was found', async () => {
    const [outsider] = await insertAll(
      db,
      'user',
      [fakeUser()]
    )

    const { getByUserId } = createCaller(
      authContext(
        { db },
        {
          id: outsider.id,
          email: outsider.email,
        }
      )
    )
    await expect(
      getByUserId()
    ).resolves.toHaveLength(0)
  })

  const { getByUserId } = createCaller(
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

  it('should get a collection of Participants by userId correctly', async () => {
    await expect(
      getByUserId()
    ).resolves.toHaveLength(2)
  })
})
