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
import { describe, it, expect } from 'vitest'
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

const [ingredient] = await insertAll(
  db,
  'ingredient',
  [fakeIngredient({ householdId: household.id })]
)

await insertAll(db, 'rcpIngr', [
  fakeRcpIngr({
    householdId: household.id,
    recipeId: recipe.id,
    ingredientId: ingredient.id,
  }),
])

describe('Recipe-Ingredient Update Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { update } = createCaller(
      requestContext({ db })
    )

    await expect(
      update({
        recipeId: recipe.id,
        ingredientId: ingredient.id,
        amount: 15,
        unit: 'unit',
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

    const { update } = createCaller(
      authContext(
        { db },
        {
          id: otherUser.id,
          email: otherUser.email,
        }
      )
    )

    await expect(
      update({
        recipeId: recipe.id,
        ingredientId: ingredient.id,
        amount: 15,
        unit: 'unit',
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

    const { update } = createCaller(
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
      update({
        recipeId: recipe.id,
        ingredientId: ingredient.id,
        amount: 15,
        unit: 'unit',
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
    const { update } = createCaller(
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
      update({
        recipeId: recipe.id,
        ingredientId: ingredient.id,
        amount: 15,
        unit: 'unit',
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

    const { update } = createCaller(
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
      update({
        recipeId: recipe.id,
        ingredientId: ingredient.id,
        amount: 15,
        unit: 'unit',
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

  const { update } = createCaller(
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
      update({
        recipeId: 'notAnId',
        ingredientId: 'ingredient.id',
        amount: 'notAnInt',
        unit: 'unit',
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
        recipeId: recipe.id,
        ingredientId: ingredient.id,
        amount: 15,
        unit: 'unit',
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

  it('should throw if no record is found in the database for the ingredientId', async () => {
    await expect(
      update({
        recipeId: recipe.id,
        ingredientId: 1312,
        amount: 15,
        unit: 'unit',
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

  it('should throw if no record is found in the database for the recipeId', async () => {
    await expect(
      update({
        recipeId: 1312,
        ingredientId: ingredient.id,
        amount: 15,
        unit: 'unit',
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

  it('should throw if the unit is not valid', async () => {
    await expect(
      update({
        recipeId: recipe.id,
        ingredientId: ingredient.id,
        amount: 15,
        unit: 'some',
      } as any)
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'BAD_REQUEST',
        message: expect.objectContaining(
          /Invalid enum value/i
        ),
        name: 'TRPCError',
      })
    )
  })

  it('should update a recipe-ingredient correctly', async () => {
    await expect(
      update({
        recipeId: recipe.id,
        ingredientId: ingredient.id,
        amount: 15,
        unit: 'unit',
      })
    ).resolves.toEqual(
      expect.objectContaining({
        recipeId: recipe.id,
        householdId: household.id,
        amount: 15,
        unit: 'unit',
      })
    )
  })

  it('should partially update a recipe-ingredient correctly', async () => {
    await expect(
      update({
        recipeId: recipe.id,
        ingredientId: ingredient.id,
        unit: 'grams',
      })
    ).resolves.toEqual(
      expect.objectContaining({
        recipeId: recipe.id,
        householdId: household.id,
        unit: 'grams',
      })
    )
  })
})
