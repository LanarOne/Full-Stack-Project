import { wrapInRollbacks } from '@server/tests/utils/transactions'
import { createTestDatabase } from '@server/tests/utils/testDatabase'
import { createCallerFactory } from '@server/trpc'
import mealRouter from '@server/controllers/meal'
import { insertAll } from '@server/tests/utils/records'
import {
  fakeHousehold,
  fakeMember,
  fakeRecipe,
  fakeUser,
  longExpiryDate,
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

describe('Meal Create Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { create } = createCaller(
      requestContext({ db })
    )

    await expect(
      create({
        portions: 6,
        recipeId: recipe.id,
        outsideMeal: null,
        eatingDate: longExpiryDate(),
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
        portions: 6,
        recipeId: recipe.id,
        outsideMeal: null,
        eatingDate: longExpiryDate(),
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
        portions: 6,
        recipeId: recipe.id,
        outsideMeal: null,
        eatingDate: longExpiryDate(),
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
        portions: 6,
        recipeId: recipe.id,
        outsideMeal: null,
        eatingDate: longExpiryDate(),
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
        portions: 6,
        recipeId: recipe.id,
        outsideMeal: null,
        eatingDate: longExpiryDate(),
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
        recipeId: 'notAnId',
        portions: true,
        outsideMeal: 1312,
        eatingDate: longExpiryDate(),
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
        portions: 6,
        recipeId: recipe.id,
        outsideMeal: null,
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
        portions: 6,
        recipeId: recipe.id,
        outsideMeal: null,
        eatingDate: longExpiryDate(),
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

  it('should throw if no record is found in the database for the recipeId', async () => {
    await expect(
      create({
        portions: 6,
        recipeId: 1312,
        outsideMeal: null,
        eatingDate: longExpiryDate(),
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

  it('should create a house meal correctly', async () => {
    await expect(
      create({
        portions: 6,
        recipeId: recipe.id,
        outsideMeal: null,
        eatingDate: longExpiryDate(),
      })
    ).resolves.toEqual(
      expect.objectContaining({
        recipeId: recipe.id,
        portions: 6,
        outsideMeal: null,
      })
    )
  })

  it('should create an outside meal correctly', async () => {
    await expect(
      create({
        portions: 6,
        outsideMeal: "Joe's Pizza",
        eatingDate: longExpiryDate(),
      })
    ).resolves.toEqual(
      expect.objectContaining({
        portions: 6,
        outsideMeal: "Joe's Pizza",
      })
    )
  })

  it('should create an undefined meal correctly', async () => {
    await expect(
      create({
        portions: 6,
        eatingDate: longExpiryDate(),
      })
    ).resolves.toEqual(
      expect.objectContaining({
        portions: 6,
        recipeId: null,
        outsideMeal: null,
      })
    )
  })
})
