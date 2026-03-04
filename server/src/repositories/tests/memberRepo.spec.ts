import { wrapInRollbacks } from '@server/tests/utils/transactions/index.js'
import { createTestDatabase } from '@server/tests/utils/testDatabase.js'
import { memberRepo } from '@server/repositories/memberRepo.js'
import { insertAll } from '@server/tests/utils/records.js'
import {
  fakeHousehold,
  fakeMember,
  fakeUser,
} from '@server/entities/test/fakes.js'
import { describe, expect, it } from 'vitest'
import type { Insertable } from 'kysely'
import type { Member } from '@server/database/types.js'

const db = await wrapInRollbacks(
  createTestDatabase()
)

const repository = await memberRepo(db)

const [user] = await insertAll(db, 'user', [
  fakeUser({ name: 'Toto' }),
])

const [household] = await insertAll(
  db,
  'household',
  [fakeHousehold({ name: 'Caca' })]
)

describe('Creates a new Member', () => {
  it('should create a new chief of household correctly', async () => {
    const result = await repository.create({
      userId: user.id,
      householdId: household.id,
      roleId: 1,
    })

    expect(result).toBeDefined()
    expect(result).toEqual({
      userId: user.id,
      householdId: household.id,
      roleId: 1,
    })
  })

  it('should create a new simple member correctly', async () => {
    const result = await repository.create({
      userId: user.id,
      householdId: household.id,
      roleId: 2,
    })

    expect(result).toBeDefined()
    expect(result).toEqual({
      userId: user.id,
      householdId: household.id,
      roleId: 2,
    })
  })

  it('should create a new guest correctly', async () => {
    const result = await repository.create({
      userId: user.id,
      householdId: household.id,
      roleId: 3,
    })

    expect(result).toBeDefined()
    expect(result).toEqual({
      userId: user.id,
      householdId: household.id,
      roleId: 3,
    })
  })

  it('should throw if no record was found in the database for the userId', async () => {
    await expect(
      repository.create({
        userId: 1312,
        householdId: household.id,
        roleId: 1,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          'violates foreign key constraint'
        ),
        name: 'error',
        code: '23503',
      })
    )
  })

  it('should throw if no record was found in the database for the housholdId', async () => {
    await expect(
      repository.create({
        userId: user.id,
        householdId: 1312,
        roleId: 1,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          'violates foreign key constraint'
        ),
        name: 'error',
        code: '23503',
      })
    )
  })

  it('should throw if no record was found in the database for the roleId', async () => {
    await expect(
      repository.create({
        userId: user.id,
        householdId: household.id,
        roleId: 4,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          'violates foreign key constraint'
        ),
        name: 'error',
        code: '23503',
      })
    )
  })

  it('should throw if userId is not valid', async () => {
    await expect(
      repository.create({
        userId: 'notAnID' as any,
        householdId: household.id,
        roleId: 2,
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

  it('should throw if the householdId is not valid', async () => {
    await expect(
      repository.create({
        userId: user.id,
        householdId: 'notAnID' as any,
        roleId: 1,
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

  it('should throw if the roleId is not valid', async () => {
    await expect(
      repository.create({
        userId: user.id,
        householdId: household.id,
        roleId: 'notAnID' as any,
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

  it('should throw if there are fields that are not in the database', async () => {
    await expect(
      repository.create({
        userId: user.id,
        householdId: household.id,
        roleId: 1,
        newField: 'malevolent hack',
      } as any as Insertable<Member>)
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

  it('should throw if a field is missing', async () => {
    await expect(
      repository.create({
        householdId: household.id,
        roleId: 1,
      } as any as Insertable<Member>)
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

describe('Finds a particular Member', () => {
  it('should find a member', async () => {
    await insertAll(db, 'member', [
      fakeMember({
        userId: user.id,
        householdId: household.id,
        roleId: 1,
      }),
    ])

    await expect(
      repository.findOne({
        userId: user.id,
        householdId: household.id,
      })
    ).resolves.toEqual(
      expect.objectContaining({
        userId: user.id,
        householdId: household.id,
        roleId: 1,
      })
    )
  })

  it('should throw if no record was found in the database for the userId', async () => {
    await expect(
      repository.findOne({
        userId: 1312,
        householdId: household.id,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if no record was found in the database for the householdId', async () => {
    await expect(
      repository.findOne({
        userId: user.id,
        householdId: 1312,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if no record was found in the database', async () => {
    await expect(
      repository.findOne({
        userId: user.id,
        householdId: household.id,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if the userId is not valid', async () => {
    await expect(
      repository.findOne({
        userId: 'notAnID' as any,
        householdId: household.id,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          'invalid input syntax'
        ),
        name: 'error',
        code: '22P02',
      })
    )
  })

  it('should throw if the householdId is not valid', async () => {
    await expect(
      repository.findOne({
        userId: user.id,
        householdId: 'notAnID' as any,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          'invalid input syntax'
        ),
        name: 'error',
        code: '22P02',
      })
    )
  })
})

describe('Finds all Members by householdId', () => {
  it('should find all members by householdId correctly', async () => {
    const [userTwo, userThree, userFour] =
      await insertAll(db, 'user', [
        fakeUser(),
        fakeUser(),
        fakeUser(),
      ])
    const [householdTwo] = await insertAll(
      db,
      'household',
      [fakeHousehold()]
    )

    await insertAll(db, 'member', [
      fakeMember({
        userId: userTwo.id,
        householdId: household.id,
      }),
      fakeMember({
        userId: user.id,
        householdId: householdTwo.id,
      }),
      fakeMember({
        userId: userThree.id,
        householdId: household.id,
      }),
      fakeMember({
        userId: userFour.id,
        householdId: householdTwo.id,
      }),
    ])

    const result =
      await repository.findByHouseholdId(
        householdTwo.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(2)
  })

  it('should return an empty array if no record was found in the database for the householdId', async () => {
    const result =
      await repository.findByHouseholdId(1312)

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should throw if the householdId is not valid', async () => {
    await expect(
      repository.findByHouseholdId(
        'notAnID' as any
      )
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

describe('Finds all households by userId', () => {
  it('should find all households by userId correctly', async () => {
    const [householdTwo, householdThree] =
      await insertAll(db, 'household', [
        fakeHousehold(),
        fakeHousehold(),
      ])
    await insertAll(db, 'member', [
      fakeMember({
        userId: user.id,
        householdId: household.id,
      }),
      fakeMember({
        userId: user.id,
        householdId: householdTwo.id,
      }),
      fakeMember({
        userId: user.id,
        householdId: householdThree.id,
      }),
    ])

    const result = await repository.findByUserId(
      user.id
    )

    expect(result).toBeDefined()
    expect(result).toHaveLength(3)
  })

  it('should return an empty array if no data was found in the database', async () => {
    const [userTwo] = await insertAll(
      db,
      'user',
      [fakeUser()]
    )

    const result = await repository.findByUserId(
      userTwo.id
    )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should return an empty array if no record was found in the database for the userId', async () => {
    const result =
      await repository.findByUserId(1312)

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should throw if the userId is not valid', async () => {
    await expect(
      repository.findByUserId('notAnID' as any)
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

describe('Updates the role of a Member', () => {
  it('should update the role of a member correctly', async () => {
    await insertAll(db, 'member', [
      fakeMember({
        householdId: household.id,
        userId: user.id,
        roleId: 3,
      }),
    ])

    const result = await repository.update({
      userId: user.id,
      householdId: household.id,
      roleId: 1,
    })

    expect(result).toBeDefined()
    expect(result.roleId).toBe(1)
  })

  it('should throw if no record was found in the database for the userId', async () => {
    const [userTwo] = await insertAll(
      db,
      'user',
      [fakeUser()]
    )

    await expect(
      repository.update({
        userId: userTwo.id,
        householdId: household.id,
        roleId: 1,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if no record was found in the database for the householdId', async () => {
    const [householdTwo] = await insertAll(
      db,
      'household',
      [fakeHousehold()]
    )

    await expect(
      repository.update({
        userId: user.id,
        householdId: householdTwo.id,
        roleId: 1,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if no record was found in the database for the roleId', async () => {
    const [householdTwo] = await insertAll(
      db,
      'household',
      [fakeHousehold()]
    )

    await expect(
      repository.update({
        userId: user.id,
        householdId: householdTwo.id,
        roleId: 4,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if the userId is invalid', async () => {
    await expect(
      repository.update({
        userId: 'notAnID' as any,
        householdId: household.id,
        roleId: 1,
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

  it('should throw if the householdId is invalid', async () => {
    await expect(
      repository.update({
        userId: user.id,
        householdId: 'notAnID' as any,
        roleId: 1,
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

  it('should throw if the roleId is invalid', async () => {
    await expect(
      repository.update({
        userId: user.id,
        householdId: household.id,
        roleId: 'notAnID' as any,
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
})

describe('Deletes a Member', () => {
  it('should delete a member correctly', async () => {
    await insertAll(db, 'member', [
      fakeMember({
        householdId: household.id,
        userId: user.id,
      }),
    ])

    const result = await repository.delete(
      user.id,
      household.id
    )

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        householdId: household.id,
        userId: user.id,
      })
    )
  })

  it('should throw if no record was found in the database for the userId', async () => {
    const [userTwo] = await insertAll(
      db,
      'user',
      [fakeUser()]
    )

    await expect(
      repository.delete(userTwo.id, household.id)
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if no record was found in the database for the householdId', async () => {
    const [householdTwo] = await insertAll(
      db,
      'household',
      [fakeHousehold()]
    )

    await expect(
      repository.delete(user.id, householdTwo.id)
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if the userId is invalid', async () => {
    await expect(
      repository.delete(
        'notAnID' as any,
        household.id
      )
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

  it('should throw if the householdId is invalid', async () => {
    await expect(
      repository.delete(user.id, 'notAnID' as any)
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
