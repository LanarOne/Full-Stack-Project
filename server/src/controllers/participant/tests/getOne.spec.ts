import { wrapInRollbacks } from '@server/tests/utils/transactions'
import { createTestDatabase } from '@server/tests/utils/testDatabase'
import { createCallerFactory } from '@server/trpc'
import participantRouter from '@server/controllers/participant'
import { insertAll } from '@server/tests/utils/records'
import {
  fakeHomeMeal,
  fakeHousehold,
  fakeMember,
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

const [homeMeal] = await insertAll(db, 'meal', [
  fakeHomeMeal({
    householdId: household.id,
    recipeId: recipe.id,
  }),
])

const [participant] = await insertAll(
  db,
  'participant',
  [
    fakeParticipant({
      mealId: homeMeal.id,
      userId: user.id,
    }),
  ]
)

describe('Participant Get One Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { getOne } = createCaller(
      requestContext({ db })
    )

    await expect(
      getOne({
        userId: user.id,
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

    const { getOne } = createCaller(
      authContext(
        { db },
        { id: outsider.id, email: outsider.email }
      )
    )

    await expect(
      getOne({
        userId: user.id,
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

  const { getOne } = createCaller(
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

  it('should throw if there is no record in the database for the user ID', async () => {
    await expect(
      getOne({
        userId: 1312,
        mealId: homeMeal.id,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'NOT_FOUND',
        name: 'TRPCError',
        message:
          'No matching record found in the database',
      })
    )
  })

  it('should throw if there is no record in the database for the meal ID', async () => {
    await expect(
      getOne({ userId: user.id, mealId: 1312 })
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'FORBIDDEN',
        name: 'TRPCError',
        message:
          'You cannot access this information',
      })
    )
  })

  it('should throw if the user ID is not properly formatted', async () => {
    await expect(
      getOne({
        userId: 'notAnId' as any,
        mealId: homeMeal.id,
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

  it('should throw if the meal ID is not properly formatted', async () => {
    await expect(
      getOne({
        userId: user.id,
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
      getOne({
        userId: user.id,
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

  it('should get a Participant to a Meal correctly', async () => {
    await expect(
      getOne({
        userId: user.id,
        mealId: homeMeal.id,
      })
    ).resolves.toEqual(
      expect.objectContaining({
        userId: user.id,
        mealId: homeMeal.id,
        attended: participant.attended,
        confirmation: participant.confirmation,
      })
    )
  })
})
