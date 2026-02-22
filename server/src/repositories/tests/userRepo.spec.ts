import { createTestDatabase } from '@server/tests/utils/testDatabase'
import { insertAll } from '@server/tests/utils/records'
import { fakeUser } from '@server/entities/test/fakes'
import { describe, it, expect } from 'vitest'
import { userRepo } from '@server/repositories/userRepo'
import { wrapInRollbacks } from '@server/tests/utils/transactions'
import type {
  Insertable,
  Updateable,
} from 'kysely'
import type { User } from '@server/database'

const db = await wrapInRollbacks(
  createTestDatabase()
)
const repository = userRepo(db)

const [user] = await insertAll(db, 'user', [
  fakeUser(),
])

describe('Creates a new user', () => {
  it('should create a user correctly', async () => {
    const newUser = await repository.create({
      email: 'some@email.com',
      password: 'somePassword1312!',
      name: 'someName',
    })

    expect(newUser).toBeDefined()
    expect(newUser.name).toBe('someName')
  })

  it('should create a user correctly with nullable fields', async () => {
    const newUser = await repository.create({
      email: 'some@email.com',
      password: 'somePassword1312!',
      name: 'someName',
      diet: 'vegan',
      allergies: 'nuts',
      profilePicture: 'http://someurl.fr',
    })

    expect(newUser).toBeDefined()
    expect(newUser).toEqual(
      expect.objectContaining({
        name: 'someName',
        diet: 'vegan',
        allergies: 'nuts',
        profilePicture: 'http://someurl.fr',
      })
    )
  })

  it('should throw if the email already exist in the database', async () => {
    await expect(
      repository.create({
        email: user.email,
        password: user.password,
        name: user.name,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        code: '23505',
        message: expect.stringContaining(
          'duplicate key value'
        ),
      })
    )
  })

  it('should throw if there are fields that are not in the database', async () => {
    await expect(
      repository.create({
        email: 'some@email.com',
        password: 'somePassword1312!',
        name: 'someName',
        newField: 'malevolent hack',
      } as any as Insertable<User>)
    ).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          'does not exist'
        ),
        name: 'error',
        code: '42703',
      })
    )
  })

  it('should throw if a required field is missing', async () => {
    await expect(
      repository.create({
        email: 'some@email.com',
        password: 'somePassword1312!',
      } as any as Insertable<User>)
    ).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          'violates not-null constraint'
        ),
        name: 'error',
        code: '23502',
      })
    )
  })
})

describe('Finds a user by ID', () => {
  it('should find a user by ID correctly', async () => {
    const result = await repository.findById(
      user.id
    )

    expect(result).toBeDefined()
    expect(result?.name).toBe(user.name)
  })

  it('should throw if the user does not exist', async () => {
    await expect(
      repository.findById(255)
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if the ID not valid', async () => {
    await expect(
      repository.findById('notAnId' as any)
    ).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          'invalid input syntax'
        ),
        code: '22P02',
        name: 'error',
      })
    )
  })
})

describe('Finds a user by email', () => {
  it('should find a user by email correctly', async () => {
    const result = await repository.findByEmail(
      user.email
    )

    expect(result).toBeDefined()
    expect(result.name).toBe(user.name)
  })

  it('should throw if the email does not exist in the database', async () => {
    await expect(
      repository.findByEmail('some@email.com')
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if the email is poorly formatted', async () => {
    await expect(
      repository.findByEmail('not.AnEmail.com')
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })
})

describe('Updates a user', () => {
  it("should update a user's name correctly", async () => {
    const result = await repository.update({
      id: user.id,
      name: 'some other name',
    } as any as Updateable<User>)

    expect(result).toBeDefined()
    expect(result.name).toBe('some other name')
  })

  it('should add value to null fields correctly', async () => {
    const result = await repository.update({
      id: user.id,
      diet: 'vegan',
      profilePicture: 'http://someurl.fr',
    } as any as Updateable<User>)

    expect(result).toBeDefined()
    expect(result.diet).toBe('vegan')
  })

  it('should nullify a previously defined nullable field', async () => {
    const [userTwo] = await insertAll(
      db,
      'user',
      [fakeUser({ allergies: 'nuts' })]
    )

    expect(userTwo.allergies).toBe('nuts')
    const result = await repository.update({
      id: userTwo.id,
      allergies: null,
      profilePicture: null,
    } as any as Updateable<User>)

    expect(result).toBeDefined()
    expect(result.allergies).toBe(null)
  })

  it('should throw if the user does not exist', async () => {
    await expect(
      repository.update({
        id: 1,
        name: 'some other name',
      } as any as Updateable<User>)
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if the ID is not valid', async () => {
    await expect(
      repository.update({
        id: 'notAnId' as any,
        name: 'some other name',
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          'invalid input syntax'
        ),
        code: '22P02',
        name: 'error',
      })
    )
  })

  it('should throw if there are invalid fields', async () => {
    await expect(
      repository.update({
        id: user.id,
        name: 'some other name',
        newField: 'malevolent hack',
      } as any as Updateable<User>)
    ).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          'does not exist'
        ),
        name: 'error',
        code: '42703',
      })
    )
  })

  it('should throw if there are fields that are not in the database', async () => {
    await expect(
      repository.update({
        id: user.id,
        password: 'somePassword1312!',
        name: 'someName',
        newField: 'malevolent hack',
      } as any as Updateable<User>)
    ).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          'does not exist'
        ),
        name: 'error',
        code: '42703',
      })
    )
  })

  it('should throw if trying to update the email adress', async () => {
    await expect(
      repository.update({
        id: user.id,
        password: 'somePassword1312!',
        email: 'someother@mail.fr',
        name: 'someName',
      } as any as Updateable<User>)
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'Email updates are not allowed',
      })
    )
  })
})

describe('Deletes a user', () => {
  it('should delete a user correctly', async () => {
    const deleted = await repository.delete(
      user.id
    )

    expect(deleted).toBeDefined()
    expect(deleted).toEqual(
      expect.objectContaining({
        email: user.email,
        name: user.name,
      })
    )
  })

  it('should throw if the user does not exist', async () => {
    await expect(
      repository.delete(255)
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if the ID not valid', async () => {
    await expect(
      repository.delete('notAnId' as any)
    ).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          'invalid input syntax'
        ),
        code: '22P02',
        name: 'error',
      })
    )
  })
})
