import { wrapInRollbacks } from '@server/tests/utils/transactions/index.js'
import { createTestDatabase } from '@server/tests/utils/testDatabase.js'
import { createCallerFactory } from '@server/trpc/index.js'
import mealRouter from '@server/controllers/meal/index.js'
import { insertAll } from '@server/tests/utils/records.js'
import {
  fakeHomeMeal,
  fakeHousehold,
  fakeMember,
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
    roleId: 2,
  }),
])

const [recipeOne, recipeTwo] = await insertAll(
  db,
  'recipe',
  [
    fakeRecipe({ householdId: household.id }),
    fakeRecipe({ householdId: household.id }),
  ]
)

await insertAll(db, 'meal', [
  fakeHomeMeal({
    householdId: household.id,
    recipeId: recipeOne.id,
  }),
  fakeHomeMeal({
    householdId: household.id,
    recipeId: recipeOne.id,
  }),
  fakeHomeMeal({
    householdId: household.id,
    recipeId: recipeTwo.id,
  }),
])

describe('Meal GetById Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { getByRecipeId } = createCaller(
      requestContext({ db })
    )

    await expect(
      getByRecipeId({ recipeId: recipeOne.id })
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

    const { getByRecipeId } = createCaller(
      authContext(
        { db },
        {
          id: otherUser.id,
          email: otherUser.email,
        }
      )
    )

    await expect(
      getByRecipeId({ recipeId: recipeOne.id })
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

    const { getByRecipeId } = createCaller(
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
      getByRecipeId({ recipeId: recipeOne.id })
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

    const { getByRecipeId } = createCaller(
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
      getByRecipeId({ recipeId: recipeOne.id })
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
    const { getByRecipeId } = createCaller(
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
      getByRecipeId({
        recipeId: recipeOne.id,
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

  const { getByRecipeId } = createCaller(
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

  it('should return an empty array if there is no record in the database for the ID', async () => {
    await expect(
      getByRecipeId({ recipeId: 1312 })
    ).resolves.toHaveLength(0)
  })

  it('should throw if the ID is not properly formatted', async () => {
    await expect(
      getByRecipeId({ recipeId: '1312' as any })
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

  it('should throw if the ID is null', async () => {
    await expect(
      getByRecipeId({ recipeId: null })
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'BAD_REQUEST',
        name: 'TRPCError',
        message: 'You must provide a recipe ID',
      })
    )
  })

  it('should throw if there are too many fields in the request', async () => {
    await expect(
      getByRecipeId({
        recipeId: recipeOne.id,
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

  it('should get a collection of home meals by RecipeId correctly', async () => {
    await expect(
      getByRecipeId({ recipeId: recipeOne.id })
    ).resolves.toHaveLength(2)
  })
})
