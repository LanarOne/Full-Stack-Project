import { wrapInRollbacks } from '@server/tests/utils/transactions'
import { createTestDatabase } from '@server/tests/utils/testDatabase'
import { createCallerFactory } from '@server/trpc'
import recipeRouter from '@server/controllers/recipe'
import { insertAll } from '@server/tests/utils/records'
import {
  fakeHousehold,
  fakeMember,
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

const createCaller =
  createCallerFactory(recipeRouter)

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

await insertAll(db, 'recipe', [
  fakeRecipe({
    householdId: household.id,
    prepTime: 30,
  }),
  fakeRecipe({
    householdId: household.id,
    prepTime: 20,
  }),
  fakeRecipe({
    householdId: household.id,
    prepTime: 60,
  }),
  fakeRecipe({
    householdId: household.id,
    prepTime: 120,
  }),
  fakeRecipe({
    householdId: household.id,
    prepTime: 40,
  }),
])

describe('Recipe Get By Preparation Time Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { getByPrepTime } = createCaller(
      requestContext({ db })
    )

    await expect(
      getByPrepTime({
        prepTime: 50,
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

    const { getByPrepTime } = createCaller(
      authContext(
        { db },
        {
          id: otherUser.id,
          email: otherUser.email,
        }
      )
    )

    await expect(
      getByPrepTime({
        prepTime: 50,
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

    const { getByPrepTime } = createCaller(
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
      getByPrepTime({
        prepTime: 50,
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
    const { getByPrepTime } = createCaller(
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
      getByPrepTime({
        prepTime: 50,
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

    const { getByPrepTime } = createCaller(
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
      getByPrepTime({
        prepTime: 50,
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

  const { getByPrepTime } = createCaller(
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
      getByPrepTime({ prepTime: 'notAnInt' })
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
      getByPrepTime({
        prepTime: 50,
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

  it('should get a collection of recipes by preparation time correctly', async () => {
    await expect(
      getByPrepTime({ prepTime: 50 })
    ).resolves.toHaveLength(3)
  })
})
