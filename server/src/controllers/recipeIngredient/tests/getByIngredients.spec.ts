import { wrapInRollbacks } from '@server/tests/utils/transactions/index.js'
import { createTestDatabase } from '@server/tests/utils/testDatabase.js'
import { createCallerFactory } from '@server/trpc/index.js'
import recipeIngredientRouter from '@server/controllers/recipeIngredient/index.js'
import { insertAll } from '@server/tests/utils/records.js'
import {
  fakeHousehold,
  fakeIngredient,
  fakeMember,
  fakeRcpIngr,
  fakeRecipe,
  fakeUser,
} from '@server/entities/test/fakes.js'
import { describe, expect, it } from 'vitest'
import {
  authContext,
  requestContext,
} from '@server/tests/utils/context.js'

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

const [
  recipe,
  secondRecipe,
  thirdRecipe,
  fourthRecipe,
] = await insertAll(db, 'recipe', [
  fakeRecipe({ householdId: household.id }),
  fakeRecipe({ householdId: household.id }),
  fakeRecipe({ householdId: household.id }),
  fakeRecipe({
    householdId: secondHousehold.id,
  }),
])

const [
  firstIngredient,
  secondIngredient,
  thirdIngredient,
  fourthIngredient,
  fifthIngredient,
  sixthIngredient,
  seventhIngredient,
] = await insertAll(db, 'ingredient', [
  fakeIngredient({ householdId: household.id }),
  fakeIngredient({ householdId: household.id }),
  fakeIngredient({ householdId: household.id }),
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
    recipeId: recipe.id,
    ingredientId: fourthIngredient.id,
    householdId: household.id,
  }),
  fakeRcpIngr({
    recipeId: secondRecipe.id,
    ingredientId: thirdIngredient.id,
    householdId: household.id,
  }),
  fakeRcpIngr({
    recipeId: secondRecipe.id,
    ingredientId: fourthIngredient.id,
    householdId: household.id,
  }),
  fakeRcpIngr({
    recipeId: secondRecipe.id,
    ingredientId: fifthIngredient.id,
    householdId: household.id,
  }),
  fakeRcpIngr({
    recipeId: secondRecipe.id,
    ingredientId: firstIngredient.id,
    householdId: household.id,
  }),
  fakeRcpIngr({
    recipeId: thirdRecipe.id,
    ingredientId: fifthIngredient.id,
    householdId: household.id,
  }),
  fakeRcpIngr({
    recipeId: thirdRecipe.id,
    ingredientId: sixthIngredient.id,
    householdId: household.id,
  }),
  fakeRcpIngr({
    recipeId: thirdRecipe.id,
    ingredientId: firstIngredient.id,
    householdId: household.id,
  }),
  fakeRcpIngr({
    recipeId: thirdRecipe.id,
    ingredientId: secondIngredient.id,
    householdId: household.id,
  }),
  fakeRcpIngr({
    recipeId: fourthRecipe.id,
    ingredientId: seventhIngredient.id,
    householdId: secondHousehold.id,
  }),
])

describe('Recipe-Ingredient Get By Recipe ID Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { getByIngredients } = createCaller(
      requestContext({ db })
    )

    await expect(
      getByIngredients([
        { ingredientId: firstIngredient.id },
        { ingredientId: secondIngredient.id },
        { ingredientId: fifthIngredient.id },
      ])
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

    const { getByIngredients } = createCaller(
      authContext(
        { db },
        {
          id: otherUser.id,
          email: otherUser.email,
        }
      )
    )

    await expect(
      getByIngredients([
        { ingredientId: firstIngredient.id },
        { ingredientId: secondIngredient.id },
        { ingredientId: fifthIngredient.id },
      ])
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

    const { getByIngredients } = createCaller(
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
      getByIngredients([
        { ingredientId: firstIngredient.id },
        { ingredientId: secondIngredient.id },
        { ingredientId: fifthIngredient.id },
      ])
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
    const { getByIngredients } = createCaller(
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
      getByIngredients([
        { ingredientId: firstIngredient.id },
        { ingredientId: secondIngredient.id },
        { ingredientId: fifthIngredient.id },
      ])
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

    const { getByIngredients } = createCaller(
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
      getByIngredients([
        { ingredientId: firstIngredient.id },
        { ingredientId: secondIngredient.id },
        { ingredientId: fifthIngredient.id },
      ])
    ).rejects.toThrow(
      expect.objectContaining({
        message:
          "You're only a guest in this household",
        code: 'BAD_REQUEST',
        name: 'TRPCError',
      })
    )
  })

  const { getByIngredients } = createCaller(
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

  it('should throw if the input has too many fields', async () => {
    await expect(
      getByIngredients({
        ingredients: [
          firstIngredient.id,
          secondIngredient.id,
          fifthIngredient.id,
        ],
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

  it('should get a collection of recipes with a collection of ingredientIds correctly', async () => {
    await expect(
      getByIngredients([
        { ingredientId: firstIngredient.id },
        { ingredientId: secondIngredient.id },
        { ingredientId: fifthIngredient.id },
      ])
    ).resolves.toHaveLength(3)
  })
})
