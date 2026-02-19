import { wrapInRollbacks } from '@server/tests/utils/transactions'
import { createTestDatabase } from '@server/tests/utils/testDatabase'
import { createCallerFactory } from '@server/trpc'
import userRouter from '..'
import { describe, it, expect } from 'vitest'
import { insertAll } from '@server/tests/utils/records'
import { fakeUser } from '@server/entities/test/fakes'
import {
  authContext,
  requestContext,
} from '@server/tests/utils/context'

const db = await wrapInRollbacks(
  createTestDatabase()
)

const createCaller =
  createCallerFactory(userRouter)

const [user] = await insertAll(db, 'user', [
  fakeUser({
    email: 'tata@coco.com',
  }),
])

describe('User Update Controller', () => {
  it('should throw if the user is not logged in', async () => {
    const { update } = createCaller(
      requestContext({ db })
    )

    await expect(
      update({
        id: user.id,
        diet: null,
        allergies: 'nuts',
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'Unauthenticated. Please log in',
      })
    )
  })

  const { update } = createCaller(
    authContext(
      { db },
      { id: user.id, email: user.email }
    )
  )

  it('should update a user in the database', async () => {
    const partialUser = {
      id: user.id,
      name: user.name,
      diet: 'gluten-free',
      allergies: null,
    }

    const result = await update(partialUser)

    expect(result).toBeDefined()
    expect(result.diet).toBe('gluten-free')
    expect(result.allergies).toBe(null)
  })

  it('should allow a partial update', async () => {
    await expect(
      update({ id: user.id, diet: 'vegan' })
    ).resolves.toEqual(
      expect.objectContaining({
        id: user.id,
        diet: 'vegan',
      })
    )
  })

  it('should throw if the user does not exist in the database', async () => {
    const partialUser = {
      id: 1312,
      diet: 'gluten-free',
      allergies: null,
      name: user.name,
    }

    await expect(
      update(partialUser)
    ).rejects.toThrow(
      expect.objectContaining({
        message:
          'No matching record found in the database',
        code: 'NOT_FOUND',
        name: 'TRPCError',
      })
    )
  })

  it('should throw if trying to update email', async () => {
    await expect(
      update({
        id: user.id,
        email: 'someother@email.com',
      })
    ).rejects.toThrow(
      expect.objectContaining({
        name: 'TRPCError',
        message: expect.objectContaining(
          /unrecognized_keys/i
        ),
        code: 'BAD_REQUEST',
      })
    )
  })

  it('should throw if trying to insert fields that are not in the database', async () => {
    await expect(
      update({
        id: user.id,
        newField: 'malevolent hack',
      } as any)
    ).rejects.toThrow(
      expect.objectContaining({
        message: expect.objectContaining(
          /unrecognized_keys/i
        ),
        name: 'TRPCError',
        code: 'BAD_REQUEST',
      })
    )
  })

  it('should throw if a field is not valid', async () => {
    await expect(
      update({ id: user.id, name: 1312 })
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'BAD_REQUEST',
        name: 'TRPCError',
      })
    )
  })
})
