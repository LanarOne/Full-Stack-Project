import {
  authContext,
  requestContext,
} from '@server/tests/utils/context'
import { describe, it, expect } from 'vitest'
import { authedProcedure } from '@server/trpc/authedProcedure/index'
import { createCallerFactory, router } from '..'

const routes = router({
  testCall: authedProcedure.query(() => 'passed'),
})

const createCaller = createCallerFactory(routes)

const VALID_TOKEN = 'valid-token'

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: (token: string) => {
      if (token !== VALID_TOKEN)
        throw new Error('Invalid token')

      return {
        user: { id: 2, email: 'toto@caca.com' },
        householdId: 2,
      }
    },
  },
}))

const db = {} as any
const authed = createCaller(authContext({ db }))

describe('Authenticated Procedure', () => {
  it('should pass if user is already authed', async () => {
    const response = await authed.testCall()

    expect(response).toEqual('passed')
  })

  it('should pass if user provides a valid token', async () => {
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
