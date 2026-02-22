import { wrapInRollbacks } from '@server/tests/utils/transactions'
import { createTestDatabase } from '@server/tests/utils/testDatabase'
import { createCallerFactory } from '@server/trpc'
import { insertAll } from '@server/tests/utils/records'
import { fakeUser } from '@server/entities/test/fakes'
import { describe, it, expect } from 'vitest'
import userRouter from '..'

const db = await wrapInRollbacks(
  createTestDatabase()
)

const createCaller =
  createCallerFactory(userRouter)

const PASSWORD_CORRECT = 'acab.1312'

const [user] = await insertAll(db, 'user', [
  fakeUser({
    email: 'toto@caca.com',
    password:
      '$2a$06$ReHvIIJwIalqXdvaw2mewultQU0ejWkoG4paCpYVBo5qLIAPbj//i',
  }),
])

const { login } = createCaller({ db } as any)

describe('User Login Controller', () => {
  it('should return a token if the password matches', async () => {
    const { token } = await login({
      email: user.email,
      password: PASSWORD_CORRECT,
    })

    expect(token).toEqual(expect.any(String))
    expect(token.slice(0, 3)).toEqual('eyJ')
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
