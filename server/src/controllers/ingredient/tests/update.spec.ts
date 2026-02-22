import { wrapInRollbacks } from '@server/tests/utils/transactions'
import { createTestDatabase } from '@server/tests/utils/testDatabase'
import { createCallerFactory } from '@server/trpc'
import ingredientRouter from '@server/controllers/ingredient'
import { insertAll } from '@server/tests/utils/records'
import {
  aWeekAgo,
  closeExpiryDate,
  fakeHousehold,
  fakeIngredient,
  fakeMember,
  fakeUser,
  longExpiryDate,
} from '@server/entities/test/fakes'
import { describe, it, expect } from 'vitest'
import {
  authContext,
  requestContext,
} from '@server/tests/utils/context'

const db = await wrapInRollbacks(
  createTestDatabase()
)

const createCaller = createCallerFactory(
  ingredientRouter
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

const [ingredient] = await insertAll(
  db,
  'ingredient',
  [
    fakeIngredient({
      householdId: household.id,
      expiryDate: longExpiryDate(),
    }),
  ]
)

describe('Ingredient Update Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { update } = createCaller(
      requestContext({ db })
    )

    await expect(
      update({
        id: ingredient.id,
        name: 'leek',
        type: 'vegetable',
        quantity: 2,
        purchaseDate: aWeekAgo(),
        expiryDate: closeExpiryDate(),
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
        id: ingredient.id,
        name: 'leek',
        type: 'vegetable',
        quantity: 2,
        purchaseDate: aWeekAgo(),
        expiryDate: closeExpiryDate(),
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
        id: ingredient.id,
        name: 'leek',
        type: 'vegetable',
        quantity: 2,
        purchaseDate: aWeekAgo(),
        expiryDate: closeExpiryDate(),
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
        id: ingredient.id,
        name: 'leek',
        type: 'vegetable',
        quantity: 2,
        purchaseDate: aWeekAgo(),
        expiryDate: closeExpiryDate(),
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
        id: ingredient.id,
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
        id: ingredient.id,
        name: 3,
        quantity: -2,
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

  it('should throw if some fields are not valid', async () => {
    await expect(
      update({
        id: ingredient.id,
        name: 3,
        quantity: -2,
        unit: 'cl',
        purchaseDate: aWeekAgo(),
        expiryDate: closeExpiryDate(),
        storage: 'outside',
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

  it('should throw if the input has too many fields', async () => {
    await expect(
      update({
        id: ingredient.id,
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

  it('should update required fields correctly', async () => {
    await expect(
      update({
        id: ingredient.id,
        name: 'leek',
        type: 'vegetable',
        quantity: 2,
        purchaseDate: aWeekAgo(),
        expiryDate: closeExpiryDate(),
      })
    ).resolves.toEqual(
      expect.objectContaining({
        name: 'leek',
        type: 'vegetable',
        quantity: 2,
      })
    )
  })

  it('should update nullable fields correctly', async () => {
    await expect(
      update({
        id: ingredient.id,
        notifInterval: 3,
        isReady: false,
        nextNotif: longExpiryDate(),
        note: 'Some valuable piece of advice',
      })
    ).resolves.toEqual(
      expect.objectContaining({
        notifInterval: 3,
        isReady: false,
        note: 'Some valuable piece of advice',
      })
    )
  })

  it('should update a single field correctly', async () => {
    await expect(
      update({
        id: ingredient.id,
        note: 'Some valuable piece of advice',
      })
    ).resolves.toEqual(
      expect.objectContaining({
        note: 'Some valuable piece of advice',
      })
    )
  })
})
