import { wrapInRollbacks } from '@server/tests/utils/transactions'
import { createTestDatabase } from '@server/tests/utils/testDatabase'
import { createCallerFactory } from '@server/trpc'
import memberRouter from '..'
import { insertAll } from '@server/tests/utils/records'
import {
  fakeHousehold,
  fakeMember,
  fakeUser,
} from '@server/entities/test/fakes'
import { describe, it, expect } from 'vitest'
import {
  authContext,
  requestContext,
} from '@server/tests/utils/context'

const db = await wrapInRollbacks(
  createTestDatabase()
)

const createCaller =
  createCallerFactory(memberRouter)

const [
  householdOne,
  householdTwo,
  householdThree,
] = await insertAll(db, 'household', [
  fakeHousehold(),
  fakeHousehold(),
  fakeHousehold(),
])

const [userOne, userTwo] = await insertAll(
  db,
  'user',
  [fakeUser(), fakeUser()]
)

await insertAll(db, 'member', [
  fakeMember({
    userId: userOne.id,
    householdId: householdOne.id,
  }),
  fakeMember({
    userId: userOne.id,
    householdId: householdTwo.id,
  }),
  fakeMember({
    userId: userOne.id,
    householdId: householdThree.id,
  }),
])

describe('Member Get By User Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { getByUserId } = createCaller(
      requestContext({ db })
    )

    await expect(getByUserId()).rejects.toThrow(
      expect.objectContaining({
        message: 'Unauthenticated. Please log in',
        code: 'UNAUTHORIZED',
        name: 'TRPCError',
      })
    )
  })

  it('should return an empty array if there is no record in the database for the userId', async () => {
    const { getByUserId } = createCaller(
      authContext(
        { db },
        { id: userTwo.id, email: userTwo.email }
      )
    )

    const result = await getByUserId()

    expect(result).toBeDefined()

    expect(result).toHaveLength(0)
  })

  it('should find all households from a member correctly', async () => {
    const { getByUserId } = createCaller(
      authContext(
        { db },
        {
          id: userOne.id,
          email: userOne.email,
        }
      )
    )

    const result = await getByUserId()

    expect(result).toBeDefined()
    expect(result).toHaveLength(3)
  })
})
