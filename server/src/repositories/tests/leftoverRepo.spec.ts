import { wrapInRollbacks } from '@server/tests/utils/transactions'
import { createTestDatabase } from '@server/tests/utils/testDatabase'
import { insertAll } from '@server/tests/utils/records'
import {
  fakeHomeMeal,
  fakeHousehold,
  fakeLeftover,
  fakeOutsideMeal,
  fakeRecipe,
} from '@server/entities/test/fakes'
import { describe, it, expect } from 'vitest'
import { leftoverRepo } from '@server/repositories/leftoverRepo'
import type {
  Insertable,
  Updateable,
} from 'kysely'
import type { Leftover } from '@server/database'
import meal from '@server/controllers/meal'
import leftover from '@server/controllers/leftover'

const db = await wrapInRollbacks(
  createTestDatabase()
)

const repository = await leftoverRepo(db)

const [household] = await insertAll(
  db,
  'household',
  [fakeHousehold()]
)

const [recipe] = await insertAll(db, 'recipe', [
  fakeRecipe({ householdId: household.id }),
])

const [homeMeal, outsideMeal] = await insertAll(
  db,
  'meal',
  [
    fakeHomeMeal({
      householdId: household.id,
      recipeId: recipe.id,
    }),
    fakeOutsideMeal({
      householdId: household.id,
    }),
  ]
)

describe('Creates a Leftover', () => {
  it('should create a leftover correctly', async () => {
    const result = await repository.create({
      mealId: homeMeal.id,
      portions: 2,
      householdId: household.id,
    })

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        mealId: homeMeal.id,
        portions: 2,
        householdId: household.id,
      })
    )
  })

  it('should throw if no record was found in the database for the mealId', async () => {
    await expect(
      repository.create({
        mealId: 1312,
        portions: 2,
        householdId: household.id,
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

  it('should throw if the mealId is not valid', async () => {
    await expect(
      repository.create({
        mealId: 'notAnId' as any,
        portions: 2,
        householdId: household.id,
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
        mealId: homeMeal.id,
        portions: 2,
        householdId: 'notAnId' as any,
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
        mealId: outsideMeal.id,
        portions: 4,
        householdId: household.id,
        newField: 'malevolent hack',
      } as any as Insertable<Leftover>)
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
        mealId: homeMeal.id,
        householdId: household.id,
      } as any as Insertable<Leftover>)
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

  it('should throw if there are invalid fields', async () => {
    await expect(
      repository.create({
        mealId: homeMeal.id,
        portions: 'notAnInt',
        expiryDate: 'notADate',
        householdId: household.id,
      } as any as Insertable<Leftover>)
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

describe('Finds Leftover by ID', () => {
  it('should find leftover by ID', async () => {
    const [leftover] = await insertAll(
      db,
      'leftover',
      [
        fakeLeftover({
          mealId: outsideMeal.id,
          householdId: household.id,
        }),
      ]
    )

    const result = await repository.findById(
      leftover.id,
      household.id
    )

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        mealId: outsideMeal.id,
        portions: leftover.portions,
        householdId: household.id,
      })
    )
  })

  it('should throw if no record was found in the database', async () => {
    await expect(
      repository.findById(1312, household.id)
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if no record was found in the database for the householdId', async () => {
    await expect(
      repository.findById(homeMeal.id, 1312)
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if the ID is not valid', async () => {
    await expect(
      repository.findById(
        'notAnId' as any,
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

  it('should throw if the householdId is not valid', async () => {
    await expect(
      repository.findById(
        homeMeal.id,
        'notAnId' as any
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

describe('Finds Leftover by mealId', () => {
  it('should find leftover by mealId correctly', async () => {
    const [leftover] = await insertAll(
      db,
      'leftover',
      [
        fakeLeftover({
          mealId: outsideMeal.id,
          householdId: household.id,
        }),
      ]
    )

    const result = await repository.findByMealId(
      outsideMeal.id,
      household.id
    )

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        mealId: outsideMeal.id,
        portions: leftover.portions,
        expiryDate: leftover.expiryDate,
        householdId: household.id,
      })
    )
  })

  it('should throw if the mealId is not valid', async () => {
    await expect(
      repository.findByMealId(
        'notAnId' as any,
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

  it('should throw if the householdId is not valid', async () => {
    await expect(
      repository.findByMealId(
        outsideMeal.id,
        'notAnId' as any
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

  it('should throw if no record was found in the database for the mealId', async () => {
    await expect(
      repository.findByMealId(1312, household.id)
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if no record was found in the database for the householdId', async () => {
    await expect(
      repository.findByMealId(homeMeal.id, 1312)
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if no record was found in the database', async () => {
    await expect(
      repository.findByMealId(
        outsideMeal.id,
        household.id
      )
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })
})

describe('Finds Leftover by householdId', () => {
  it('should find a collection of leftovers by householdId correctly', async () => {
    await insertAll(db, 'leftover', [
      fakeLeftover({
        mealId: outsideMeal.id,
        householdId: household.id,
      }),
      fakeLeftover({
        mealId: homeMeal.id,
        householdId: household.id,
      }),
    ])

    const result =
      await repository.findByHouseholdId(
        household.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(2)
  })

  it('should throw if the householdId is not valid', async () => {
    await expect(
      repository.findByHouseholdId(
        'notAnId' as any
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

  it('should return an empty array if no record was found in the database for the householdId', async () => {
    await expect(
      repository.findByHouseholdId(1312)
    ).resolves.toHaveLength(0)
  })

  it('should throw if no record was found in the database', async () => {
    const [emptyHousehold] = await insertAll(
      db,
      'household',
      [fakeHousehold()]
    )

    await expect(
      repository.findByHouseholdId(
        emptyHousehold.id
      )
    ).resolves.toHaveLength(0)
  })
})

describe('Updates a Leftover', () => {
  it('should update a leftover correctly', async () => {
    const [leftover] = await insertAll(
      db,
      'leftover',
      [
        fakeLeftover({
          mealId: homeMeal.id,
          householdId: household.id,
        }),
      ]
    )

    const result = await repository.update({
      id: leftover.id,
      portions: 1,
      householdId: household.id,
    } as any as Updateable<Leftover>)

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        mealId: homeMeal.id,
        portions: 1,
        householdId: household.id,
      })
    )
  })

  it('should throw if no record was found in the database', async () => {
    await expect(
      repository.update({
        id: 1312,
        portions: 1,
        householdId: household.id,
      } as any as Updateable<Leftover>)
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if no record was found in the database for the householdId', async () => {
    const [leftover] = await insertAll(
      db,
      'leftover',
      [
        fakeLeftover({
          mealId: homeMeal.id,
          householdId: household.id,
        }),
      ]
    )

    await expect(
      repository.update({
        id: leftover.id,
        portions: 1,
        householdId: 1312,
      } as any as Updateable<Leftover>)
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if there are invalid fields', async () => {
    const [leftover] = await insertAll(
      db,
      'leftover',
      [
        fakeLeftover({
          mealId: homeMeal.id,
          householdId: household.id,
        }),
      ]
    )

    await expect(
      repository.update({
        id: leftover.id,
        portions: 'notAnInt',
        householdId: household.id,
      } as any as Updateable<Leftover>)
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

describe('Deletes Leftover', () => {
  it('should delete leftover correctly', async () => {
    const [leftover] = await insertAll(
      db,
      'leftover',
      [
        fakeLeftover({
          mealId: outsideMeal.id,
          householdId: household.id,
        }),
      ]
    )

    const result = await repository.delete(
      leftover.id,
      household.id
    )

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        mealId: outsideMeal.id,
        portions: leftover.portions,
        householdId: household.id,
      })
    )
  })

  it('should throw if no record was found in the database', async () => {
    await expect(
      repository.delete(1312, household.id)
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if no record was found in the database for the household', async () => {
    const [leftover] = await insertAll(
      db,
      'leftover',
      [
        fakeLeftover({
          mealId: outsideMeal.id,
          householdId: household.id,
        }),
      ]
    )

    await expect(
      repository.delete(leftover.id, 1312)
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if the ID is not valid', async () => {
    await expect(
      repository.delete(
        'notAnId' as any,
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

  it('should throw if the householdId is not valid', async () => {
    const [leftover] = await insertAll(
      db,
      'leftover',
      [
        fakeLeftover({
          mealId: outsideMeal.id,
          householdId: household.id,
        }),
      ]
    )

    await expect(
      repository.delete(
        leftover.id,
        'notAnId' as any
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
