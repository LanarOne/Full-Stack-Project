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
      outsideMeal: 'Ankara',
    }),
  ]
)

await insertAll(db, 'participant', [
  fakeParticipant({
    userId: user.id,
    mealId: homeMeal.id,
    confirmation: null,
  }),
])

describe('Participant Update Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { update } = createCaller(
      requestContext({ db })
    )

    await expect(
      update({
        mealId: homeMeal.id,
        userId: user.id,
        confirmation: null,
        attended: false,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'Unauthenticated. Please log in',
        code: 'UNAUTHORIZED',
        name: 'TRPCError',
      })
    )
  })

  const { update } = createCaller(
    authContext(
      { db },
      {
        id: user.id,
        email: user.email,
      }
    )
  )

  it('should throw if some fields are not properly formatted', async () => {
    await expect(
      update({
        mealId: homeMeal.id,
        user: user.id,
        confirmation: 1312,
        attended: 'false',
      } as any)
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'BAD_REQUEST',
        message:
          expect.objectContaining(
            /invalid_type/i
          ),
        name: 'TRPCError',
      })
    )
  })

  it('should throw if the input has too many fields', async () => {
    await expect(
      update({
        mealId: homeMeal.id,
        user: user.id,
        confirmation: null,
        attended: false,
        newField: 'malevolent hack',
      } as any)
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'BAD_REQUEST',
        message: expect.objectContaining(
          /unrecognized_keys/i
        ),
        name: 'TRPCError',
      })
    )
  })

  it('should throw if no record is found in the database for the mealId', async () => {
    await expect(
      update({
        mealId: 1312,
        userId: user.id,
        confirmation: null,
        attended: false,
      } as any)
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'FORBIDDEN',
        message:
          'You cannot access this information',
        name: 'TRPCError',
      })
    )
  })

  it('should throw if no record is found in the database for the userId', async () => {
    await expect(
      update({
        mealId: outsideMeal.id,
        userId: 1312,
        confirmation: null,
        attended: false,
      } as any)
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'FORBIDDEN',
        message:
          'You cannot access this information',
        name: 'TRPCError',
      })
    )
  })

  it('should update a participant correctly', async () => {
    await expect(
      update({
        mealId: homeMeal.id,
        userId: user.id,
        confirmation: true,
        attended: true,
      })
    ).resolves.toEqual(
      expect.objectContaining({
        mealId: homeMeal.id,
        userId: user.id,
        confirmation: true,
        attended: true,
      })
    )
  })

  it('should update a single field in a Participant correctly', async () => {
    await expect(
      update({
        mealId: homeMeal.id,
        userId: user.id,
        attended: true,
      })
    ).resolves.toEqual(
      expect.objectContaining({
        mealId: homeMeal.id,
        userId: user.id,
        attended: true,
      })
    )
  })
})
