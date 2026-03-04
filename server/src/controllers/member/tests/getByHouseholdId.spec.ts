import { wrapInRollbacks } from '@server/tests/utils/transactions/index.js'
import { createTestDatabase } from '@server/tests/utils/testDatabase.js'
import { createCallerFactory } from '@server/trpc/index.js'
import { insertAll } from '@server/tests/utils/records.js'
import {
  fakeHousehold,
  fakeMember,
  fakeUser,
} from '@server/entities/test/fakes.js'
import { describe, it, expect } from 'vitest'
import {
  authContext,
  requestContext,
} from '@server/tests/utils/context.js'
import memberRouter from '../index.js'

const db = await wrapInRollbacks(
  createTestDatabase()
)

const createCaller =
  createCallerFactory(memberRouter)

const [householdOne, householdTwo] =
  await insertAll(db, 'household', [
    fakeHousehold(),
    fakeHousehold(),
  ])

const [userOne, userTwo, userThree, userFour] =
  await insertAll(db, 'user', [
    fakeUser(),
    fakeUser(),
    fakeUser(),
    fakeUser(),
  ])

await insertAll(db, 'member', [
  fakeMember({
    householdId: householdOne.id,
    userId: userOne.id,
    roleId: 1,
  }),
  fakeMember({
    householdId: householdOne.id,
    userId: userTwo.id,
    roleId: 2,
  }),
  fakeMember({
    householdId: householdOne.id,
    userId: userThree.id,
    roleId: 2,
  }),
  fakeMember({
    householdId: householdTwo.id,
    userId: userFour.id,
    roleId: 1,
  }),
  fakeMember({
    householdId: householdTwo.id,
    userId: userTwo.id,
    roleId: 3,
  }),
])

describe('Member Get By Household Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { getByHouseholdId } = createCaller(
      requestContext({ db })
    )

    await expect(
      getByHouseholdId()
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'Unauthenticated. Please log in',
        code: 'UNAUTHORIZED',
        name: 'TRPCError',
      })
    )
  })

  it('should throw if the user is logged in, but not in a household', async () => {
    const { getByHouseholdId } = createCaller(
      authContext(
        { db },
        { id: userOne.id, email: userOne.email }
      )
    )

    await expect(
      getByHouseholdId()
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

    const { getByHouseholdId } = createCaller(
      authContext(
        { db },
        {
          id: outsideUser.id,
          email: outsideUser.email,
        },
        { id: householdOne.id }
      )
    )

    await expect(
      getByHouseholdId()
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
    const { getByHouseholdId } = createCaller(
      authContext(
        { db },
        { id: userOne.id, email: userOne.email },
        { id: 1312 }
      )
    )

    await expect(
      getByHouseholdId()
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'BAD_REQUEST',
        name: 'TRPCError',
        message:
          "You're not part of this household",
      })
    )
  })

  it('should find all members from a household correctly', async () => {
    const { getByHouseholdId } = createCaller(
      authContext(
        { db },
        {
          id: userThree.id,
          email: userThree.email,
        },
        { id: householdOne.id }
      )
    )

    const result = await getByHouseholdId()

    expect(result).toBeDefined()
    expect(result).toHaveLength(3)
  })
})
