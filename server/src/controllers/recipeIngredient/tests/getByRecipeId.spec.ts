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

const [recipe, secondRecipe] = await insertAll(
  db,
  'recipe',
  [
    fakeRecipe({ householdId: household.id }),
    fakeRecipe({
      householdId: secondHousehold.id,
    }),
  ]
)

const [
  firstIngredient,
  secondIngredient,
  thirdIngredient,
  fourthIngredient,
] = await insertAll(db, 'ingredient', [
  fakeIngredient({ householdId: household.id }),
  fakeIngredient({ householdId: household.id }),
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
    recipeId: recipe.id,
    ingredientId: secondIngredient.id,
    householdId: household.id,
  }),
  fakeRcpIngr({
    recipeId: recipe.id,
    ingredientId: thirdIngredient.id,
    householdId: household.id,
  }),
  fakeRcpIngr({
    recipeId: secondRecipe.id,
    ingredientId: fourthIngredient.id,
    householdId: secondHousehold.id,
  }),
])

describe('Recipe-Ingredient Get By Recipe ID Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { getByRecipeId } = createCaller(
      requestContext({ db })
    )

    await expect(
      getByRecipeId({
        recipeId: recipe.id,
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
      getByRecipeId({
        recipeId: recipe.id,
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
      getByRecipeId({
        recipeId: recipe.id,
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
        recipeId: recipe.id,
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
      getByRecipeId({
        recipeId: recipe.id,
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

  it('should throw if a field is not properly formatted', async () => {
    await expect(
      getByRecipeId({
        recipeId: 'notAnId' as any,
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
      getByRecipeId({
        recipeId: recipe.id,
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

  it('should get a collection of ingredients by recipeId correctly', async () => {
    await expect(
      getByRecipeId({ recipeId: recipe.id })
    ).resolves.toHaveLength(3)
  })
})
