import { wrapInRollbacks } from '@server/tests/utils/transactions/index.js'
import { createTestDatabase } from '@server/tests/utils/testDatabase.js'
import { createCallerFactory } from '@server/trpc/index.js'
import inredientRouter from '@server/controllers/ingredient/index.js'
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
  inredientRouter
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
  }),
])

const [ingredient] = await insertAll(
  db,
  'ingredient',
  [fakeIngredient({ householdId: household.id })]
)

describe('Ingredient GetById Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { getById } = createCaller(
      requestContext({ db })
    )

    await expect(
      getById({ id: ingredient.id })
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

    const { getById } = createCaller(
      authContext(
        { db },
        {
          id: otherUser.id,
          email: otherUser.email,
        }
      )
    )

    await expect(
      getById({ id: ingredient.id })
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

    const { getById } = createCaller(
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
      getById({ id: ingredient.id })
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
    const { getById } = createCaller(
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
      getById({
        id: ingredient.id,
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

    const { getById } = createCaller(
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
      getById({ id: ingredient.id })
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'BAD_REQUEST',
        name: 'TRPCError',
        message:
          "You're only a guest in this household",
      })
    )
  })

  const { getById } = createCaller(
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

  it('should throw if there is no record in the database for the ID', async () => {
    await expect(
      getById({ id: 1312 })
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'NOT_FOUND',
        name: 'TRPCError',
        message:
          'No matching record found in the database',
      })
    )
  })

  it('should throw if the ID is not properly formatted', async () => {
    await expect(
      getById({ id: '1312' as any })
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

  it('should throw if there are too many fields in the request', async () => {
    await expect(
      getById({
        id: ingredient.id,
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

  it('should get an ingredient by ID correctly', async () => {
    await expect(
      getById({ id: ingredient.id })
    ).resolves.toEqual(
      expect.objectContaining(ingredient)
    )
  })
})
