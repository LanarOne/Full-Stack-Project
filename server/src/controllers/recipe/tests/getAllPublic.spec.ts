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

const [
  household,
  secondHousehold,
  thirdHousehold,
] = await insertAll(db, 'household', [
  fakeHousehold(),
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

describe('Recipe Get All Public Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { getAllPublic } = createCaller(
      requestContext({ db })
    )

    await expect(getAllPublic()).rejects.toThrow(
      expect.objectContaining({
        message: 'Unauthenticated. Please log in',
        code: 'UNAUTHORIZED',
        name: 'TRPCError',
      })
    )
  })

  const { getAllPublic } = createCaller(
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

  it('should return an empty array if no public recipes were found', async () => {
    await expect(
      getAllPublic()
    ).resolves.toHaveLength(0)
  })

  it('should get a collection of public recipes correctly', async () => {
    await insertAll(db, 'recipe', [
      fakeRecipe({
        householdId: household.id,
        public: true,
      }),
      fakeRecipe({
        householdId: secondHousehold.id,
        public: true,
      }),
      fakeRecipe({
        householdId: thirdHousehold.id,
        public: true,
      }),
      fakeRecipe({
        householdId: household.id,
        public: false,
      }),
      fakeRecipe({
        householdId: secondHousehold.id,
        public: false,
      }),
      fakeRecipe({
        householdId: thirdHousehold.id,
        public: false,
      }),
    ])

    await expect(
      getAllPublic()
    ).resolves.toHaveLength(3)
  })
})
