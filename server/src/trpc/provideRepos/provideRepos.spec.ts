import {
  afterEach,
  describe,
  vi,
  it,
  expect,
} from 'vitest'
import { z } from 'zod'
import {
  createCallerFactory,
  publicProcedure,
  router,
} from '../index.js'
import provideRepos from './index.js'

const db = {} as any
const userRepoBuilder = vi.fn(() => {}) as any

const routes = router({
  testCall: publicProcedure
    .use(
      provideRepos({ userRepo: userRepoBuilder })
    )
    .input(z.object({}))
    .query(() => 'ok'),
})

afterEach(() => {
  vi.resetAllMocks()
})

describe('Provides repos', () => {
  it('should provide repos', async () => {
    const ctx = {
      db,
    }
    const caller = createCallerFactory(routes)
    const { testCall } = caller(ctx as any)

    expect(await testCall({})).toEqual('ok')
    expect(userRepoBuilder).toHaveBeenCalledWith(
      db
    )
  })

  it('should skip providing repos if they are already in context', async () => {
    const ctx = {
      db,
      repos: {
        userRepo: {},
      },
    }

    const caller = createCallerFactory(routes)
    const { testCall } = caller(ctx as any)

    expect(await testCall({})).toEqual('ok')
    expect(userRepoBuilder).not.toHaveBeenCalled()
  })
})
