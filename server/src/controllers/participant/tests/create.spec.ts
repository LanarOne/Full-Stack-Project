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

describe('Participant Create Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { create } = createCaller(
      requestContext({ db })
    )

    await expect(
      create({
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

  it('should throw if the user is logged in but not in the household', async () => {
    const [otherUser] = await insertAll(
      db,
      'user',
      [fakeUser()]
    )

    const { create } = createCaller(
      authContext(
        { db },
        {
          id: otherUser.id,
          email: otherUser.email,
        }
      )
    )

    await expect(
      create({
        mealId: homeMeal.id,
        userId: user.id,
        confirmation: null,
        attended: false,
      })
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

    const { create } = createCaller(
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
      create({
        mealId: outsideMeal.id,
        userId: user.id,
        confirmation: null,
        attended: false,
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

  it('should throw if there is no record in the database for the householdId', async () => {
    const { create } = createCaller(
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
      create({
        mealId: outsideMeal.id,
        userId: user.id,
        confirmation: null,
        attended: false,
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

    const { create } = createCaller(
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
      create({
        mealId: homeMeal.id,
        userId: user.id,
        confirmation: null,
        attended: false,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message:
          "You're only a guest in this household",
        code: 'BAD_REQUEST',
        name: 'TRPCError',
      })
    )
  })

  const { create } = createCaller(
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

  it('should throw if some fields are not properly formatted', async () => {
    await expect(
      create({
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

  it('should throw if a required fields is missing', async () => {
    await expect(
      create({
        mealId: homeMeal.id,
        user: user.id,
        attended: false,
      } as any)
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'BAD_REQUEST',
        message:
          expect.objectContaining(/Required/i),
        name: 'TRPCError',
      })
    )
  })

  it('should throw if the input has too many fields', async () => {
    await expect(
      create({
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
      create({
        mealId: 1312,
        userId: user.id,
        confirmation: null,
        attended: false,
      } as any)
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'NOT_FOUND',
        message:
          'No matching record found in the database',
        name: 'TRPCError',
      })
    )
  })

  it('should throw if no record is found in the database for the userId', async () => {
    await expect(
      create({
        mealId: outsideMeal.id,
        userId: 1312,
        confirmation: null,
        attended: false,
      } as any)
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'NOT_FOUND',
        message:
          'No matching record found in the database',
        name: 'TRPCError',
      })
    )
  })

  it('should create a participant without nullable fields correctly', async () => {
    await expect(
      create({
        mealId: homeMeal.id,
        userId: user.id,
      })
    ).resolves.toEqual(
      expect.objectContaining({
        mealId: homeMeal.id,
        userId: user.id,
        confirmation: null,
        attended: false,
      })
    )
  })

  it('should create a participant with nullable fields correctly', async () => {
    await expect(
      create({
        mealId: homeMeal.id,
        userId: user.id,
        confirmation: null,
        attended: false,
      })
    ).resolves.toEqual(
      expect.objectContaining({
        mealId: homeMeal.id,
        userId: user.id,
        confirmation: null,
        attended: false,
      })
    )
  })
})
