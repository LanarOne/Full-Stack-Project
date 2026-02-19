import { createTestDatabase } from '@server/tests/utils/testDatabase'
import { describe, expect, it } from 'vitest'
import { insertAll } from '@server/tests/utils/records'
import { householdRepo } from '@server/repositories/householdRepo'
import { fakeHousehold } from '@server/entities/test/fakes'
import { wrapInRollbacks } from '@server/tests/utils/transactions'

const db = await wrapInRollbacks(
  createTestDatabase()
)
const repository = householdRepo(db)

const [household] = await insertAll(
  db,
  'household',
  [fakeHousehold()]
)

describe('Creates a new Household', () => {
  it('should create an household correctly', async () => {
    const newHousehold = await repository.create({
      name: 'test household',
    })

    expect(newHousehold).toBeDefined()
    expect(newHousehold.name).toBe(
      'test household'
    )
  })

  it('should create an household with nullable fields correctly', async () => {
    const newHousehold = await repository.create({
      name: 'test household',
      profilePicture: 'http://someurl.com',
    })

    expect(newHousehold).toBeDefined()
    expect(newHousehold.name).toBe(
      'test household'
    )
    expect(newHousehold.profilePicture).toBe(
      'http://someurl.com'
    )
  })
})

describe('Finds an Household by ID', () => {
  it('should find an household by ID correctly', async () => {
    const result = await repository.findById(
      household.id
    )

    expect(result).toBeDefined()
    expect(result.name).toBe(household.name)
  })

  it('should throw if the household does not exist', async () => {
    await expect(
      repository.findById(255)
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if the ID is poorly formatted', async () => {
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

describe('Updates the name of an Household', () => {
  it('should update the name of an household correctly', async () => {
    const updated = await repository.update(
      household.id,
      {
        name: 'some new name',
      }
    )

    expect(updated).toBeDefined()
    expect(updated.name).toBe('some new name')
  })

  it('should update nullable fields correctly', async () => {
    await expect(
      repository.update(household.id, {
        profilePicture: 'http://someotherurl.com',
      } as any)
    ).resolves.toEqual(
      expect.objectContaining({
        profilePicture: 'http://someotherurl.com',
        name: household.name,
      })
    )
  })

  it('should throw if the household does not exist', async () => {
    await expect(
      repository.update(255, {
        name: 'some name',
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if the ID is poorly formatted', async () => {
    await expect(
      repository.update('notAnId' as any, {
        name: 'some new name',
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

describe('Deletes an Household', () => {
  it('should delete an household correctly', async () => {
    const deleted = await repository.delete(
      household.id
    )

    expect(deleted).toBeDefined()
    expect(deleted).toEqual(
      expect.objectContaining({
        name: household.name,
      })
    )
  })

  it('should throw if the household does not exist', async () => {
    await expect(
      repository.delete(255)
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if the ID is poorly formatted', async () => {
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
