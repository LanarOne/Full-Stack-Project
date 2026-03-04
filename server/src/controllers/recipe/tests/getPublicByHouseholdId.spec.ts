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

await insertAll(db, 'recipe', [
  fakeRecipe({
    householdId: household.id,
    public: true,
  }),
  fakeRecipe({
    householdId: household.id,
    public: true,
  }),
  fakeRecipe({
    householdId: household.id,
    public: true,
  }),
  fakeRecipe({
    householdId: secondHousehold.id,
    public: false,
  }),
  fakeRecipe({
    householdId: secondHousehold.id,
    public: false,
  }),
  fakeRecipe({
    householdId: household.id,
    public: false,
  }),
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

describe('Recipe Get All Public By Household Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { getPublicByHouseholdId } =
      createCaller(requestContext({ db }))

    await expect(
      getPublicByHouseholdId({
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

  const { getPublicByHouseholdId } = createCaller(
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

  it('should throw if the input is not properly formatted', async () => {
    await expect(
      getPublicByHouseholdId({
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
      getPublicByHouseholdId({
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

  it('should return an empty array if no public recipes were found', async () => {
    await expect(
      getPublicByHouseholdId({
        householdId: secondHousehold.id,
      })
    ).resolves.toHaveLength(0)
  })

  it('should get a collection of public recipes by household correctly', async () => {
    await expect(
      getPublicByHouseholdId({
        householdId: household.id,
      })
    ).resolves.toHaveLength(3)
  })
})
