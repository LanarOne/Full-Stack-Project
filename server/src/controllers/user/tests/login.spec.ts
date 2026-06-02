import { wrapInRollbacks } from '@server/tests/utils/transactions/index.js'
import { createTestDatabase } from '@server/tests/utils/testDatabase.js'
import { createCallerFactory } from '@server/trpc/index.js'
import { insertAll } from '@server/tests/utils/records.js'
import { fakeUser } from '@server/entities/test/fakes.js'
import { describe, it, expect, vi } from 'vitest'
import userRouter from '../index.js'

const db = await wrapInRollbacks(
  createTestDatabase()
)

const createCaller =
  createCallerFactory(userRouter)

const PASSWORD_CORRECT = 'acab.1312'

const [user] = await insertAll(db, 'user', [
  fakeUser({
    email: 'some@email.com',
    password:
      '$2a$06$ReHvIIJwIalqXdvaw2mewultQU0ejWkoG4paCpYVBo5qLIAPbj//i',
  }),
])
const cookie = vi.fn()
const { login } = createCaller({
  db,
  res: { cookie },
} as any)

describe('User Login Controller', () => {
  it('should return a user object and a cookie if the password matches', async () => {
    const result = await login({
      email: user.email,
      password: PASSWORD_CORRECT,
    })

    expect(result).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({
          id: user.id,
          email: user.email,
        }),
      })
    )

    expect(result).not.toHaveProperty('token')
    expect(cookie).toHaveBeenCalledWith(
      'auth_token',
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      })
    )
  })

  it('should throw an error for non-existant user', async () => {
    await expect(
      login({
        email: 'nota@user.com',
        password: PASSWORD_CORRECT,
      } as any)
    ).rejects.toThrow(
      expect.objectContaining({
        message:
          'No matching record found in the database',
        code: 'NOT_FOUND',
        name: 'TRPCError',
      })
    )
  })

  it('should throw an error for incorrect password', async () => {
    await expect(
      login({
        email: user.email,
        password: 'wr0ngpa$$w0rD',
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'Incorrect password',
        code: 'UNAUTHORIZED',
        name: 'TRPCError',
      })
    )
  })

  it('should throw an error for invalid email', async () => {
    await expect(
      login({
        email: 'notAnEmail.co',
        password: PASSWORD_CORRECT,
      })
    ).rejects.toThrow(/email/i)
  })

  it('should throw an error if the password is too short', async () => {
    await expect(
      login({
        email: user.email,
        password: 'sh0rt',
      })
    ).rejects.toThrow(/password/i)
  })

  it('should allow logging in with different email case', async () => {
    await expect(
      login({
        email: user.email.toUpperCase(),
        password: PASSWORD_CORRECT,
      })
    ).resolves.toEqual(expect.anything())
  })

  it('should allow logging in with surrounding white space', async () => {
    await expect(
      login({
        email: `  \t ${user.email}  \t  `,
        password: PASSWORD_CORRECT,
      } as any)
    ).resolves.toEqual(expect.anything())
  })
})
