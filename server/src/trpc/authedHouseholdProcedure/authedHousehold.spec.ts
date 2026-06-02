import {
  authContext,
  requestContext,
} from '@server/tests/utils/context.js'
import { describe, expect } from 'vitest'
import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure/index.js'
import { wrapInRollbacks } from '@server/tests/utils/transactions/index.js'
import { createTestDatabase } from '@server/tests/utils/testDatabase.js'
import { insertAll } from '@server/tests/utils/records.js'
import {
  fakeHousehold,
  fakeMember,
  fakeUser,
} from '@server/entities/test/fakes.js'
import { z } from 'zod'
import {
  createCallerFactory,
  router,
} from '../index.js'

const routes = router({
  testCall: authedHouseholdProcedure
    .input(z.object({ householdId: z.number() }))
    .query(() => 'passed'),
})

const createCaller = createCallerFactory(routes)

const db = await wrapInRollbacks(
  createTestDatabase()
)

const [user] = await insertAll(db, 'user', [
  fakeUser(),
])
const [household, otherHousehold] =
  await insertAll(db, 'household', [
    fakeHousehold(),
    fakeHousehold(),
  ])

describe('Authenticated Household Procedure', () => {
  it('should pass if user and the household are already authed ', async () => {
    const authedHousehold = createCaller(
      authContext({
        db,
        authUser: {
          id: user.id,
          email: user.email,
        },
        authHousehold: { id: household.id },
      })
    )
    const response =
      await authedHousehold.testCall({
        householdId: household.id,
      })

    expect(response).toEqual('passed')
  })

  it('should pass if authed user belongs to the requested household', async () => {
    const caller = createCaller(
      authContext({
        db,
        authUser: {
          id: user.id,
          email: user.email,
        },
      })
    )
    await insertAll(db, 'member', [
      fakeMember({
        userId: user.id,
        householdId: household.id,
        roleId: 1,
      }),
    ])

    const response = await caller.testCall({
      householdId: household.id,
    })

    expect(response).toEqual('passed')
  })

  it('should throw an error if user is not logged in', async () => {
    const unauthed = createCaller(
      requestContext({ db })
    )

    await expect(
      unauthed.testCall({
        householdId: household.id,
      })
    ).rejects.toThrow(
      /login|log in|logged in|authenticate|unauthorized/i
    )
  })

  it('should throw an error if the householdId is missing', async () => {
    const caller = createCaller(
      authContext({
        db,
        authUser: {
          id: user.id,
          email: user.email,
        },
      })
    )

    await expect(
      caller.testCall({} as any)
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'BAD_REQUEST',
        name: 'TRPCError',
      })
    )
  })

  it('should throw an error if the user is not a member of the household', async () => {
    const caller = createCaller(
      authContext({
        db,
        authUser: {
          id: user.id,
          email: user.email,
        },
      })
    )

    await expect(
      caller.testCall({
        householdId: otherHousehold.id,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'INTERNAL_SERVER_ERROR',
        name: 'TRPCError',
      })
    )
  })
})
