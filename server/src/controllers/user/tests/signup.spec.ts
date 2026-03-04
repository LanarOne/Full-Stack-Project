import { wrapInRollbacks } from '@server/tests/utils/transactions/index.js'
import { createTestDatabase } from '@server/tests/utils/testDatabase.js'
import { createCallerFactory } from '@server/trpc/index.js'
import { describe, expect, it } from 'vitest'
import { fakeUser } from '@server/entities/test/fakes.js'
import { selectAll } from '@server/tests/utils/records.js'
import userRouter from '../index.js'

const db = await wrapInRollbacks(
  createTestDatabase()
)

const createCaller =
  createCallerFactory(userRouter)

const PASSWORD_CORRECT = 'acab.1312'

const { signup } = createCaller({ db })

describe('User signup controller', () => {
  it('should save a user in the database correctly', async () => {
    const user = fakeUser({
      password: PASSWORD_CORRECT,
    })
    const response = await signup(user as any)

    const [userCreated] = await selectAll(
      db,
      'user',
      (eb) => eb('email', '=', user.email)
    )

    expect(userCreated.password).toHaveLength(60)

    expect(response).toEqual({
      id: userCreated.id,
    })
  })

  it('should throw if the email is not valid', async () => {
    await expect(
      signup(
        fakeUser({
          email: 'nota.validEmail.com',
        }) as any
      )
    ).rejects.toThrow(/email/i)
  })

  it('should throw an error if the password is not valid', async () => {
    await expect(
      signup(
        fakeUser({ password: 'pasword' }) as any
      )
    ).rejects.toThrow(/password/i)
  })

  it('should store lowercased email', async () => {
    const user = fakeUser({
      email: 'TOTO@CACA.COM',
    })

    await signup(user as any)

    const userSaved = await selectAll(
      db,
      'user',
      (eb) =>
        eb('email', '=', user.email.toLowerCase())
    )

    expect(userSaved).toHaveLength(1)
    expect(userSaved[0].email).toBe(
      'toto@caca.com'
    )
  })

  it('should store email with trimmed whitespace', async () => {
    const user = fakeUser({
      email: `  \t some@email.com \t  `,
    })
    await signup(user as any)

    const userSaved = await selectAll(
      db,
      'user',
      (eb) => eb('email', '=', user.email.trim())
    )

    expect(userSaved).toHaveLength(1)
    expect(userSaved[0].email).toBe(
      'some@email.com'
    )
  })

  it('should throw if the email already exists in the database', async () => {
    await signup(
      fakeUser({ email: 'un@courriel.fr' }) as any
    )

    await expect(
      signup(
        fakeUser({
          email: 'un@courriel.fr',
        }) as any
      )
    ).rejects.toThrow(
      expect.objectContaining({
        message:
          'Record already exists in the database',
        code: 'BAD_REQUEST',
        name: 'TRPCError',
      })
    )
  })
})
