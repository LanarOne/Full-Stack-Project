import { wrapInRollbacks } from '@server/tests/utils/transactions/index.js'
import { createTestDatabase } from '@server/tests/utils/testDatabase.js'
import { createCallerFactory } from '@server/trpc/index.js'
import recipeRouter from '@server/controllers/recipe/index.js'
import { insertAll } from '@server/tests/utils/records.js'
import {
  fakeHousehold,
  fakeMember,
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

const createCaller =
  createCallerFactory(recipeRouter)

const [household, secondHousehold] =
  await insertAll(db, 'household', [
    fakeHousehold(),
    fakeHousehold(),
  ])

const [user, secondUser] = await insertAll(
  db,
  'user',
  [fakeUser(), fakeUser()]
)

await insertAll(db, 'member', [
  fakeMember({
    householdId: household.id,
    userId: user.id,
    roleId: 1,
  }),
  fakeMember({
    householdId: secondHousehold.id,
    userId: secondUser.id,
    roleId: 1,
  }),
])

const [recipe, notPublic] = await insertAll(
  db,
  'recipe',
  [
    fakeRecipe({
      householdId: household.id,
      public: true,
    }),
    fakeRecipe({
      householdId: household.id,
      public: false,
    }),
  ]
)

describe('Recipe Get Public By ID Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { getPublicById } = createCaller(
      requestContext({ db })
    )

    await expect(
      getPublicById({
        id: recipe.id,
        householdId: household.id,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'Unauthenticated. Please log in',
        code: 'UNAUTHORIZED',
        name: 'TRPCError',
      })
    )
  })

  it('should throw if there is no record in the database for the householdId', async () => {
    const { getPublicById } = createCaller(
      authContext(
        { db },
        {
          id: secondUser.id,
          email: secondUser.email,
        },
        { id: secondHousehold.id }
      )
    )

    await expect(
      getPublicById({
        id: recipe.id,
        householdId: 1312,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message:
          'No matching record found in the database',
        code: 'NOT_FOUND',
        name: 'TRPCError',
      })
    )
  })

  const { getPublicById } = createCaller(
    authContext(
      { db },
      {
        id: secondUser.id,
        email: secondUser.email,
      },
      {
        id: secondHousehold.id,
      }
    )
  )

  it('should throw if the ID is not properly formatted', async () => {
    await expect(
      getPublicById({
        id: 'notAnId' as any,
        householdId: household.id,
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

  it('should throw if the householdId is not properly formatted', async () => {
    await expect(
      getPublicById({
        id: recipe.id,
        householdId: 'notAnId' as any,
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
      getPublicById({
        id: recipe.id,
        householdId: household.id,
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

  it('should throw if the recipe is not public', async () => {
    await expect(
      getPublicById({
        id: notPublic.id,
        householdId: household.id,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'UNAUTHORIZED',
        message: 'This recipe is not public',
        name: 'TRPCError',
      })
    )
  })

  it('should get a public recipe by ID correctly', async () => {
    await expect(
      getPublicById({
        id: recipe.id,
        householdId: household.id,
      })
    ).resolves.toEqual(
      expect.objectContaining({
        name: recipe.name,
        description: recipe.description,
        portions: recipe.portions,
        prepTime: recipe.prepTime,
        public: true,
      })
    )
  })
})
