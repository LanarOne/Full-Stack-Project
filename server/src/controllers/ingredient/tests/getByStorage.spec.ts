import { wrapInRollbacks } from '@server/tests/utils/transactions/index.js'
import { createTestDatabase } from '@server/tests/utils/testDatabase.js'
import { createCallerFactory } from '@server/trpc/index.js'
import ingredientRouter from '@server/controllers/ingredient/index.js'
import { insertAll } from '@server/tests/utils/records.js'
import {
  fakeHousehold,
  fakeIngredient,
  fakeMember,
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
  ingredientRouter
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

await insertAll(db, 'ingredient', [
  fakeIngredient({
    householdId: household.id,
    storage: 'fridge',
  }),
  fakeIngredient({
    householdId: household.id,
    storage: 'freezer',
  }),
  fakeIngredient({
    householdId: household.id,
    storage: 'dry storage',
  }),
  fakeIngredient({
    householdId: household.id,
    storage: 'freezer',
  }),
  fakeIngredient({
    householdId: household.id,
    storage: 'fridge',
  }),
  fakeIngredient({
    householdId: household.id,
    storage: 'freezer',
  }),
])

describe('Ingredient Get By Storage Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { getByStorage } = createCaller(
      requestContext({ db })
    )

    await expect(
      getByStorage({ storage: 'dry storage' })
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

    const { getByStorage } = createCaller(
      authContext(
        { db },
        {
          id: otherUser.id,
          email: otherUser.email,
        }
      )
    )

    await expect(
      getByStorage({ storage: 'freezer' })
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

    const { getByStorage } = createCaller(
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
      getByStorage({ storage: 'fridge' })
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
    const { getByStorage } = createCaller(
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
      getByStorage({ storage: 'dry storage' })
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'BAD_REQUEST',
        name: 'TRPCError',
        message:
          "You're not part of this household",
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

    const { getByStorage } = createCaller(
      authContext(
        { db },
        {
          id: guestUser.id,
          email: guestUser.email,
        },
        { id: household.id }
      )
    )

    await expect(
      getByStorage({ storage: 'fridge' })
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'BAD_REQUEST',
        name: 'TRPCError',
        message:
          "You're only a guest in this household",
      })
    )
  })

  it('should return an empty array if there is no record in the database for the type', async () => {
    await insertAll(db, 'member', [
      fakeMember({
        householdId: secondHousehold.id,
        userId: user.id,
        roleId: 2,
      }),
    ])

    const { getByStorage } = createCaller(
      authContext(
        { db },
        {
          id: user.id,
          email: user.email,
        },
        { id: secondHousehold.id }
      )
    )

    const result = await getByStorage({
      storage: 'freezer',
    })

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  const { getByStorage } = createCaller(
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

  it('should throw if the storage is not properly formatted', async () => {
    await expect(
      getByStorage({ storage: 1312 as any })
    ).rejects.toThrow(
      expect.objectContaining({
        message:
          expect.objectContaining(
            /invalid_type/i
          ),
        code: 'BAD_REQUEST',
        name: 'TRPCError',
      })
    )
  })

  it('should throw if the storage is not valid', async () => {
    await expect(
      getByStorage({ storage: 'outside' as any })
    ).rejects.toThrow(
      expect.objectContaining({
        message: expect.objectContaining(
          /invalid_enum_value/i
        ),
        code: 'BAD_REQUEST',
        name: 'TRPCError',
      })
    )
  })

  it('should throw if there are too many fields in the request', async () => {
    await expect(
      getByStorage({
        storage: 'freezer',
        newField: 'malevolent hack',
      } as any)
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

  it('should get a collection of ingredients in freezer correctly', async () => {
    const result = await getByStorage({
      storage: 'freezer',
    })

    expect(result).toBeDefined()
    expect(result).toHaveLength(3)
  })

  it('should get a collection of ingredients in fridge correctly', async () => {
    const result = await getByStorage({
      storage: 'fridge',
    })

    expect(result).toBeDefined()
    expect(result).toHaveLength(2)
  })

  it('should get a collection of ingredients in dry storage correctly', async () => {
    const result = await getByStorage({
      storage: 'dry storage',
    })

    expect(result).toBeDefined()
    expect(result).toHaveLength(1)
  })
})
