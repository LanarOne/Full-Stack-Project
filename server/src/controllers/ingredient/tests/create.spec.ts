import { wrapInRollbacks } from '@server/tests/utils/transactions/index.js'
import { createTestDatabase } from '@server/tests/utils/testDatabase.js'
import { createCallerFactory } from '@server/trpc/index.js'
import { insertAll } from '@server/tests/utils/records.js'
import {
  aWeekAgo,
  closeExpiryDate,
  fakeHousehold,
  fakeIngredient,
  fakeMember,
  fakeUser,
  longExpiryDate,
} from '@server/entities/test/fakes.js'
import { describe, it, expect } from 'vitest'
import {
  authContext,
  requestContext,
} from '@server/tests/utils/context.js'
import inredientRouter from '../index.js'

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
    roleId: 1,
  }),
])

describe('Ingredient Create Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { create } = createCaller(
      requestContext({ db })
    )

    await expect(
      create(fakeIngredient() as any)
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

    const { create } = createCaller(
      authContext(
        { db },
        {
          id: otherUser.id,
          email: otherUser.email,
        }
      )
    )

    await expect(
      create(fakeIngredient() as any)
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

    const { create } = createCaller(
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
      create({
        name: 'carrot',
        type: 'vegetable',
        quantity: 2,
        unit: 'unit',
        purchaseDate: aWeekAgo(),
        expiryDate: longExpiryDate(),
        storage: 'dry storage',
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
    const { create } = createCaller(
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
      create({
        name: 'leek',
        type: 'vegetable',
        quantity: 2,
        unit: 'unit',
        purchaseDate: aWeekAgo(),
        expiryDate: closeExpiryDate(),
        storage: 'fridge',
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

    const { create } = createCaller(
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
      create({
        name: 'leek',
        type: 'vegetable',
        quantity: 2,
        unit: 'unit',
        purchaseDate: aWeekAgo(),
        expiryDate: closeExpiryDate(),
        storage: 'fridge',
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

  const { create } = createCaller(
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

  it('should create an ingredient without nullable fields correctly', async () => {
    await expect(
      create({
        name: 'leek',
        type: 'vegetable',
        quantity: 2,
        unit: 'unit',
        purchaseDate: aWeekAgo(),
        expiryDate: closeExpiryDate(),
        storage: 'fridge',
      })
    ).resolves.toEqual(
      expect.objectContaining({
        name: 'leek',
        type: 'vegetable',
        quantity: 2,
        unit: 'unit',
        storage: 'fridge',
        householdId: household.id,
      })
    )
  })

  it('should create an ingredient with nullable fields correctly', async () => {
    await expect(
      create({
        name: 'leek',
        type: 'vegetable',
        quantity: 2,
        unit: 'unit',
        purchaseDate: aWeekAgo(),
        expiryDate: closeExpiryDate(),
        storage: 'fridge',
        notifInterval: 5,
        nextNotif: closeExpiryDate(),
        isReady: true,
        note: 'some piece of advice',
      })
    ).resolves.toEqual(
      expect.objectContaining({
        name: 'leek',
        type: 'vegetable',
        quantity: 2,
        unit: 'unit',
        storage: 'fridge',
        householdId: household.id,
        notifInterval: 5,
        isReady: true,
        note: 'some piece of advice',
      })
    )
  })

  it('should throw if some fields are not properly formatted', async () => {
    await expect(
      create({
        name: 3,
        type: true,
        quantity: '2',
        unit: 'unit',
        purchaseDate: aWeekAgo(),
        expiryDate: closeExpiryDate(),
        storage: 'fridge',
        notifInterval: 5,
        nextNotif: '2026-02-15',
        isReady: 2,
        note: 'some piece of advice',
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

  it('should throw if some required fields are missing', async () => {
    await expect(
      create({
        name: 'leek',
        quantity: 2,
        purchaseDate: aWeekAgo(),
        expiryDate: closeExpiryDate(),
        storage: 'fridge',
      } as any)
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'BAD_REQUEST',
        message:
          expect.objectContaining(/Required/i),
        name: 'TRPCError',
      })
    )
  })

  it('should throw if the input has too many fields', async () => {
    await expect(
      create({
        name: 'leek',
        type: 'vegetable',
        quantity: 2,
        unit: 'unit',
        purchaseDate: aWeekAgo(),
        expiryDate: closeExpiryDate(),
        storage: 'fridge',
        notifInterval: 5,
        nextNotif: new Date('2026-02-15'),
        isReady: true,
        note: 'some piece of advice',
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
})
