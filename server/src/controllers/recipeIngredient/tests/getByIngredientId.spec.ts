import { wrapInRollbacks } from '@server/tests/utils/transactions'
import { createTestDatabase } from '@server/tests/utils/testDatabase'
import { createCallerFactory } from '@server/trpc'
import recipeIngredientRouter from '@server/controllers/recipeIngredient'
import { insertAll } from '@server/tests/utils/records'
import {
  fakeHousehold,
  fakeIngredient,
  fakeMember,
  fakeRcpIngr,
  fakeRecipe,
  fakeUser,
} from '@server/entities/test/fakes'
import { describe, expect, it } from 'vitest'
import {
  authContext,
  requestContext,
} from '@server/tests/utils/context'

const db = await wrapInRollbacks(
  createTestDatabase()
)

const createCaller = createCallerFactory(
  recipeIngredientRouter
)

const [household, secondHousehold] =
  await insertAll(db, 'household', [
    fakeHousehold(),
    fakeHousehold(),
  ])

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

const [recipe, secondRecipe, thirdRecipe] =
  await insertAll(db, 'recipe', [
    fakeRecipe({ householdId: household.id }),
    fakeRecipe({
      householdId: secondHousehold.id,
    }),
    fakeRecipe({ householdId: household.id }),
  ])

const [firstIngredient, secondIngredient] =
  await insertAll(db, 'ingredient', [
    fakeIngredient({ householdId: household.id }),
    fakeIngredient({
      householdId: secondHousehold.id,
    }),
  ])

await insertAll(db, 'rcpIngr', [
  fakeRcpIngr({
    recipeId: recipe.id,
    ingredientId: firstIngredient.id,
    householdId: household.id,
  }),
  fakeRcpIngr({
    recipeId: secondRecipe.id,
    ingredientId: firstIngredient.id,
    householdId: household.id,
  }),
  fakeRcpIngr({
    recipeId: thirdRecipe.id,
    ingredientId: firstIngredient.id,
    householdId: household.id,
  }),
  fakeRcpIngr({
    recipeId: secondRecipe.id,
    ingredientId: secondIngredient.id,
    householdId: secondHousehold.id,
  }),
])

describe('Recipe-Ingredient Get By Ingredient ID Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { getByIngredientId } = createCaller(
      requestContext({ db })
    )

    await expect(
      getByIngredientId({
        ingredientId: firstIngredient.id,
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

    const { getByIngredientId } = createCaller(
      authContext(
        { db },
        {
          id: otherUser.id,
          email: otherUser.email,
        }
      )
    )

    await expect(
      getByIngredientId({
        ingredientId: firstIngredient.id,
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

    const { getByIngredientId } = createCaller(
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
      getByIngredientId({
        ingredientId: firstIngredient.id,
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
    const { getByIngredientId } = createCaller(
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
      getByIngredientId({
        ingredientId: firstIngredient.id,
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

    const { getByIngredientId } = createCaller(
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
      getByIngredientId({
        ingredientId: firstIngredient.id,
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

  const { getByIngredientId } = createCaller(
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

  it('should throw if a field is not properly formatted', async () => {
    await expect(
      getByIngredientId({
        ingredientId: 'notAnId' as any,
      })
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
      getByIngredientId({
        ingredientId: firstIngredient.id,
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

  it('should get a collection of recipes by ingredientId correctly', async () => {
    await expect(
      getByIngredientId({
        ingredientId: firstIngredient.id,
      })
    ).resolves.toHaveLength(3)
  })
})
