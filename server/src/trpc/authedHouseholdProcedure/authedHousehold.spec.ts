import {
  authContext,
  requestContext,
} from '@server/tests/utils/context'
import { describe, expect } from 'vitest'
import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure/index'
import { wrapInRollbacks } from '@server/tests/utils/transactions'
import { createTestDatabase } from '@server/tests/utils/testDatabase'
import { insertAll } from '@server/tests/utils/records'
import {
  fakeHousehold,
  fakeMember,
  fakeUser,
} from '@server/entities/test/fakes'
import { createCallerFactory, router } from '..'

const routes = router({
  testCall: authedHouseholdProcedure.query(
    () => 'passed'
  ),
})

const createCaller = createCallerFactory(routes)

const db = await wrapInRollbacks(
  createTestDatabase()
)

const VALID_TOKEN = 'valid-token'

const [user] = await insertAll(db, 'user', [
  fakeUser(),
])
const [household] = await insertAll(
  db,
  'household',
  [fakeHousehold()]
)

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: (token: string) => {
      if (token !== VALID_TOKEN)
        throw new Error('Invalid token')
      return {
        user: {
          id: user.id,
          email: 'tata@coco.fr',
        },
        household: { id: household.id },
      }
    },
  },
}))

const authedHousehold = createCaller(
  authContext({ db })
)

describe('Authenticated Household Procedure', () => {
  it('should pass if user and the household are already authed ', async () => {
    const response =
      await authedHousehold.testCall()

    expect(response).toEqual('passed')
  })

  it('should pass if user provides a valid token', async () => {
    await insertAll(db, 'member', [
      fakeMember({
        userId: user.id,
        householdId: household.id,
        roleId: 1,
      }),
    ])
    const usingValidToken = createCaller({
      db,
      req: {
        header: () => `Bearer ${VALID_TOKEN}`,
      } as any,
    })

    const response =
      await usingValidToken.testCall()

    expect(response).toEqual('passed')
  })

  it('should throw an error if user is not logged in', async () => {
    const unauthed = createCaller(
      requestContext({ db })
    )

    await expect(
      unauthed.testCall()
    ).rejects.toThrow(
      /login|log in|logged in|authenticate|unauthorized/i
    )
  })

  it('should throw an error if it is run without access to headers', async () => {
    const invalidToken = createCaller(
      requestContext({
        db,
        req: undefined as any,
      })
    )

    await expect(
      invalidToken.testCall()
    ).rejects.toThrow(/Express/i)
  })

  it('should throw an error if user provides invalid token', async () => {
    const invalidToken = createCaller(
      requestContext({
        db,
        req: {
          header: () => 'Bearer invalid-token',
        } as any,
      })
    )

    await expect(
      invalidToken.testCall()
    ).rejects.toThrow(/token/i)
  })
})
