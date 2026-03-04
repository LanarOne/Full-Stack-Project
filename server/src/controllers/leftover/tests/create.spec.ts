import { wrapInRollbacks } from '@server/tests/utils/transactions/index.js'
import { createTestDatabase } from '@server/tests/utils/testDatabase.js'
import { createCallerFactory } from '@server/trpc/index.js'
import leftoverRouter from '@server/controllers/leftover/index.js'
import { insertAll } from '@server/tests/utils/records.js'
import {
  closeExpiryDate,
  fakeHomeMeal,
  fakeHousehold,
  fakeMember,
  fakeOutsideMeal,
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

describe('Leftover Create Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { create } = createCaller(
      requestContext({ db })
    )

    await expect(
      create({
        mealId: homeMeal.id,
        portions: 2,
        expiryDate: closeExpiryDate(),
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
        portions: 2,
        expiryDate: closeExpiryDate(),
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
        portions: 2,
        expiryDate: closeExpiryDate(),
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
        portions: 2,
        expiryDate: closeExpiryDate(),
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
        portions: 2,
        expiryDate: closeExpiryDate(),
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
        mealId: 'notAnId',
        portions: true,
        expiryDate: closeExpiryDate(),
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

  it('should throw if a date is not properly formatted', async () => {
    await expect(
      create({
        mealId: outsideMeal.id,
        portions: 2,
        expiryDate: '2026*12*13',
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
        portions: 2,
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
        portions: 2,
        expiryDate: closeExpiryDate(),
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
        portions: 2,
        expiryDate: closeExpiryDate(),
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

  it('should create a leftover for a housemeal correctly', async () => {
    await expect(
      create({
        mealId: homeMeal.id,
        portions: 2,
        expiryDate: closeExpiryDate(),
      })
    ).resolves.toEqual(
      expect.objectContaining({
        mealId: homeMeal.id,
        portions: 2,
      })
    )
  })

  it('should create a leftover for an outside meal correctly', async () => {
    await expect(
      create({
        mealId: outsideMeal.id,
        portions: 2,
        expiryDate: closeExpiryDate(),
      })
    ).resolves.toEqual(
      expect.objectContaining({
        mealId: outsideMeal.id,
        portions: 2,
      })
    )
  })
})
