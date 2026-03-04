import { createTestDatabase } from '@server/tests/utils/testDatabase.js'
import { describe, expect, it } from 'vitest'
import { insertAll } from '@server/tests/utils/records.js'
import {
  closeExpiryDate,
  fakeHousehold,
  fakeIngredient,
  longExpiryDate,
  someDaysAgo,
} from '@server/entities/test/fakes.js'
import { ingredientRepo } from '@server/repositories/ingredientRepo.js'
import { wrapInRollbacks } from '@server/tests/utils/transactions/index.js'
import {
  type Insertable,
  type Updateable,
} from 'kysely'
import type { Ingredient } from '@server/database/types.js'

const db = await wrapInRollbacks(
  createTestDatabase()
)

const repository = await ingredientRepo(db)

const [household] = await insertAll(
  db,
  'household',
  [fakeHousehold()]
)

const [ingredient] = await insertAll(
  db,
  'ingredient',
  [
    fakeIngredient({
      householdId: household.id,
    }),
  ]
)

describe('Creates a new ingredient', () => {
  it('should create an ingredient correctly', async () => {
    const newIngredient = await repository.create(
      {
        name: 'carrot',
        type: 'vegetable',
        quantity: 2,
        unit: 'unit',
        purchaseDate: new Date('2025-12-25')
          .toISOString()
          .slice(0, 10),
        expiryDate: new Date('2026-01-15')
          .toISOString()
          .slice(0, 10),
        householdId: household.id,
        storage: 'fridge',
      }
    )

    expect(newIngredient).toBeDefined()
    expect(newIngredient).toEqual(
      expect.objectContaining({
        name: 'carrot',
        type: 'vegetable',
        quantity: 2,
        unit: 'unit',
        householdId: household.id,
        storage: 'fridge',
      })
    )
  })

  it('should create an ingredient with nullable fields correctly', async () => {
    const newIngredient = await repository.create(
      {
        name: 'carrot',
        type: 'vegetable',
        quantity: 2,
        unit: 'unit',
        purchaseDate: new Date('2025-12-25')
          .toISOString()
          .slice(0, 10),
        expiryDate: new Date('2026-01-15')
          .toISOString()
          .slice(0, 10),
        householdId: household.id,
        storage: 'freezer',
        notifInterval: 5,
        nextNotif: new Date('2026-01-20'),
        note: 'some guidance',
      }
    )

    expect(newIngredient).toBeDefined()
    expect(newIngredient).toEqual(
      expect.objectContaining({
        name: 'carrot',
        type: 'vegetable',
        quantity: 2,
        unit: 'unit',
        householdId: household.id,
        notifInterval: 5,
        nextNotif: new Date('2026-01-20'),
        note: 'some guidance',
      })
    )
  })

  it('should throw if no record was found in the database for the householdId', async () => {
    await expect(
      repository.create({
        name: 'carrot',
        type: 'vegetable',
        quantity: 2,
        unit: 'unit',
        purchaseDate: new Date('2025-12-25')
          .toISOString()
          .slice(0, 10),
        expiryDate: new Date('2026-01-15')
          .toISOString()
          .slice(0, 10),
        householdId: 1312,
        storage: 'fridge',
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          'violates foreign key constraint'
        ),
        code: '23503',
        name: 'error',
      })
    )
  })

  it('should throw if a required field is missing', async () => {
    await expect(
      repository.create({
        name: 'carrot',
        quantity: 2,
        unit: 'unit',
        purchaseDate: new Date('2025-12-25')
          .toISOString()
          .slice(0, 10),
        expiryDate: new Date('2026-01-15')
          .toISOString()
          .slice(0, 10),
        householdId: household.id,
        storage: 'fridge',
      } as any as Insertable<Ingredient>)
    ).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          'violates not-null constraint'
        ),
        code: '23502',
        name: 'error',
      })
    )
  })

  it('should throw if there are fields that are not in the database', async () => {
    await expect(
      repository.create({
        name: 'carrot',
        type: 'vegetable',
        quantity: 2,
        unit: 'unit',
        purchaseDate: new Date('2025-12-25')
          .toISOString()
          .slice(0, 10),
        expiryDate: new Date('2026-01-15')
          .toISOString()
          .slice(0, 10),
        householdId: household.id,
        storage: 'freezer',
        newField: 'malevolent hack',
      } as any as Insertable<Ingredient>)
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

  it('should throw if the date is poorly formatted', async () => {
    await expect(
      repository.create({
        name: 'carrot',
        type: 'vegetable',
        quantity: 2,
        unit: 'unit',
        purchaseDate: '25/12/2025',
        expiryDate: new Date('2026-01-15')
          .toISOString()
          .slice(0, 10),
        householdId: household.id,
        storage: 'dry storage',
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          'value out of range'
        ),
        code: '22008',
        name: 'error',
      })
    )
  })

  it('should throw if there are invalid fields', async () => {
    await expect(
      repository.create({
        name: 1312,
        type: 'vegetable',
        quantity: 'notAnInt',
        unit: 'unit',
        purchaseDate: 'notADate',
        expiryDate: new Date('2026-01-15')
          .toISOString()
          .slice(0, 10),
        householdId: household.id,
        storage: 'dry storage',
      } as any as Insertable<Ingredient>)
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

  it('should throw if the unit is invalid', async () => {
    await expect(
      repository.create({
        name: 'flour',
        type: 'flour',
        quantity: 1,
        unit: 'kilo',
        purchaseDate: someDaysAgo(),
        expiryDate: new Date('2026-01-15')
          .toISOString()
          .slice(0, 10),
        householdId: household.id,
        storage: 'dry storage',
      } as any as Insertable<Ingredient>)
    ).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          'violates check constraint'
        ),
        name: 'error',
        code: '23514',
      })
    )
  })

  it('should throw if the storage is not valid', async () => {
    await expect(
      repository.create({
        name: 'flour',
        type: 'flour',
        quantity: 100,
        unit: 'grams',
        purchaseDate: someDaysAgo(),
        expiryDate: new Date('2026-01-15')
          .toISOString()
          .slice(0, 10),
        householdId: household.id,
        storage: 'outside',
      } as any as Insertable<Ingredient>)
    ).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          'violates check constraint'
        ),
        name: 'error',
        code: '23514',
      })
    )
  })
})

describe('Finds an Ingredient by ID', () => {
  it('should find an ingredient by ID correctly', async () => {
    const result = await repository.findById(
      ingredient.id,
      household.id
    )

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        name: ingredient.name,
        type: ingredient.type,
        quantity: ingredient.quantity,
        purchaseDate: ingredient.purchaseDate,
        expiryDate: ingredient.expiryDate,
        householdId: household.id,
        storage: ingredient.storage,
      })
    )
  })

  it('should throw if no record was found in the database', async () => {
    await expect(
      repository.findById(255, household.id)
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

  it('should throw if no record was found in the database for the householdId', async () => {
    await expect(
      repository.findById(ingredient.id, 1312)
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if the householdId is not valid', async () => {
    await expect(
      repository.findById(
        ingredient.id,
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

describe('Finds all ingredients by type', () => {
  it('should find all ingredients with the same type', async () => {
    await insertAll(db, 'ingredient', [
      fakeIngredient({
        type: 'vegetable',
        householdId: household.id,
      }),
      fakeIngredient({
        type: 'vegetable',
        householdId: household.id,
      }),
      fakeIngredient({
        type: 'meat',
        householdId: household.id,
      }),
      fakeIngredient({
        type: 'condiment',
        householdId: household.id,
      }),
    ])

    const result = await repository.findByType(
      'vegetable',
      household.id
    )

    expect(result).toBeDefined()
    expect(result.length).toBe(2)
  })

  it('should return an empty array if no matches were found', async () => {
    const result = await repository.findByType(
      'vegetable',
      household.id
    )

    expect(result).toHaveLength(0)
  })

  it('should throw if the householdId is not valid', async () => {
    await expect(
      repository.findByType(
        'veg',
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

  it('should return an empty array if the no record was found in the database for the householdId', async () => {
    const result = await repository.findByType(
      'veg',
      1312
    )

    expect(result).toHaveLength(0)
  })
})

describe('Finds all ingredients by householdId', () => {
  it('should return all ingredients by householdId', async () => {
    const [householdOne, householdTwo] =
      await insertAll(db, 'household', [
        fakeHousehold(),
        fakeHousehold(),
      ])

    await insertAll(db, 'ingredient', [
      fakeIngredient({
        type: 'vegetable',
        householdId: householdOne.id,
      }),
      fakeIngredient({
        type: 'vegetable',
        householdId: householdTwo.id,
      }),
      fakeIngredient({
        type: 'meat',
        householdId: householdOne.id,
      }),
      fakeIngredient({
        type: 'condiment',
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

  it('should return an empty array if no record was found in the data', async () => {
    const result =
      await repository.findByHouseholdId(255)

    expect(result).toHaveLength(0)
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
})

describe('Finds all ingredients with passed expiryDate', () => {
  it('should return all ingredients with passed expiryDate', async () => {
    await insertAll(db, 'ingredient', [
      fakeIngredient({
        expiryDate: new Date('2025-12-25'),
        householdId: household.id,
      }),
      fakeIngredient({
        expiryDate: new Date('2025-12-29'),
        householdId: household.id,
      }),
      fakeIngredient({
        expiryDate: new Date('2026-01-15'),
        householdId: household.id,
      }),
      fakeIngredient({
        expiryDate: new Date('2026-01-30'),
        householdId: household.id,
      }),
    ])

    const result =
      await repository.findByPassedExpiryDate(
        '2026-01-05' as any,
        household.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(2)
  })

  it('should return an empty array if no data was found', async () => {
    const result =
      await repository.findByPassedExpiryDate(
        '2026/01/01' as any,
        household.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should throw if the date is not valid', async () => {
    await expect(
      repository.findByPassedExpiryDate(
        '25/01/2026' as any,
        household.id
      )
    ).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          'field value out of range'
        ),
        name: 'error',
        code: '22008',
      })
    )
  })

  it('should throw if the householdId is not valid', async () => {
    await expect(
      repository.findByPassedExpiryDate(
        new Date('2026-02-25'),
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

  it('should return an empty array if the no record was found in the database for the householdId', async () => {
    const result =
      await repository.findByPassedExpiryDate(
        new Date('2026-02-25'),
        1312
      )

    expect(result).toHaveLength(0)
  })
})

describe('Finds all ingredients with soon-to-be-passed expiryDate', () => {
  it('should return all ingredients with soon-to-be-passed expiryDate', async () => {
    await insertAll(db, 'ingredient', [
      fakeIngredient({
        expiryDate: closeExpiryDate(),
        householdId: household.id,
      }),
      fakeIngredient({
        expiryDate: closeExpiryDate(),
        householdId: household.id,
      }),
      fakeIngredient({
        expiryDate: longExpiryDate(),
        householdId: household.id,
      }),
      fakeIngredient({
        expiryDate: longExpiryDate(),
        householdId: household.id,
      }),
    ])

    const result =
      await repository.findSoonToBeExpired(
        household.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(2)
  })

  it('should return an empty array if no data was found', async () => {
    const result =
      await repository.findSoonToBeExpired(
        household.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should throw if the householdId is not valid', async () => {
    await expect(
      repository.findSoonToBeExpired(
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

  it('should return an empty array if the no record was found in the database for the householdId', async () => {
    const result =
      await repository.findSoonToBeExpired(1312)

    expect(result).toHaveLength(0)
  })
})

describe('Finds all ingredient with low quantity', () => {
  it('should return a collection of ingredients with low quantity correctly', async () => {
    await insertAll(db, 'ingredient', [
      fakeIngredient({
        householdId: household.id,
        unit: 'unit',
        quantity: 1,
      }),
      fakeIngredient({
        householdId: household.id,
        unit: 'unit',
        quantity: 1,
      }),
      fakeIngredient({
        householdId: household.id,
        unit: 'grams',
        quantity: 100,
      }),
      fakeIngredient({
        householdId: household.id,
        unit: 'grams',
        quantity: 100,
      }),
      fakeIngredient({
        householdId: household.id,
        unit: 'ml',
        quantity: 100,
      }),
      fakeIngredient({
        householdId: household.id,
        unit: 'ml',
        quantity: 100,
      }),
    ])

    const result =
      await repository.findByLowQuantity(
        household.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(6)
  })

  it('should return an empty array if no record was found in the database for the householdId', async () => {
    const result =
      await repository.findByLowQuantity(1312)

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should return an empty array if no record were found in the database', async () => {
    const result =
      await repository.findByLowQuantity(
        household.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })
})

describe('Finds ingredient by storage', () => {
  it('should find all ingredients by storage correctly', async () => {
    await insertAll(db, 'ingredient', [
      fakeIngredient({
        householdId: household.id,
        storage: 'dry storage',
      }),
      fakeIngredient({
        householdId: household.id,
        storage: 'dry storage',
      }),
      fakeIngredient({
        householdId: household.id,
        storage: 'fridge',
      }),
      fakeIngredient({
        householdId: household.id,
        storage: 'freezer',
      }),
    ])

    const result = await repository.findByStorage(
      household.id,
      { storage: 'dry storage' }
    )

    expect(result).toBeDefined()
    expect(result).toHaveLength(2)
  })

  it('should return an empty array if the storage is not valid', async () => {
    const result = await repository.findByStorage(
      household.id,
      'outside' as any
    )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should return an empty array if no record was found for the householdId', async () => {
    const result = await repository.findByStorage(
      1312,
      { storage: 'freezer' }
    )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })
})

describe('Updates an Ingredient', () => {
  it('should update an ingredient correctly', async () => {
    const result = await repository.update(
      {
        id: ingredient.id,
        name: 'carrot',
        type: 'veg',
        quantity: 5,
        unit: 'unit',
        storage: 'dry storage',
      } as any as Updateable<Ingredient>,
      household.id
    )

    expect(result).toBeDefined()
    expect(result.quantity).toBe(5)
    expect(result.storage).toBe('dry storage')
  })

  it('should update nullable fields correctly', async () => {
    await expect(
      repository.update(
        {
          id: ingredient.id,
          notifInterval: 10,
          nextNotif: longExpiryDate(),
          note: 'some guidance',
          isReady: false,
        },
        household.id
      )
    ).resolves.toEqual(
      expect.objectContaining({
        notifInterval: 10,
        note: 'some guidance',
        isReady: false,
      })
    )
  })

  it('should nullify nullable fields again', async () => {
    await expect(
      repository.update(
        {
          id: ingredient.id,
          quantity: 0,
          notifInterval: null,
          nextNotif: null,
          note: null,
        },
        household.id
      )
    ).resolves.toEqual(
      expect.objectContaining({
        quantity: 0,
        notifInterval: null,
        nextNotif: null,
        note: null,
      })
    )
  })

  it('should throw if the unit is not valid', async () => {
    await expect(
      repository.update(
        {
          id: ingredient.id,
          name: 'carrot',
          type: 'veg',
          quantity: 5,
          unit: 'kilo',
          storage: 'dry storage',
        } as any as Updateable<Ingredient>,
        household.id
      )
    ).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          'violates check constraint'
        ),
        code: '23514',
        name: 'error',
      })
    )
  })

  it('should throw if the storage is not valid', async () => {
    await expect(
      repository.update(
        {
          id: ingredient.id,
          name: 'carrot',
          type: 'veg',
          quantity: 5,
          unit: 'unit',
          storage: 'outside',
        } as any as Updateable<Ingredient>,
        household.id
      )
    ).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          'violates check constraint'
        ),
        code: '23514',
        name: 'error',
      })
    )
  })

  it('should throw if no record was found in the database', async () => {
    await expect(
      repository.update(
        {
          id: 13,
          name: 'carrot',
          type: 'veg',
          quantity: 5,
          unit: 'unit',
        } as any,
        household.id
      )
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if no record for the householdId was found in the database', async () => {
    await expect(
      repository.update(
        {
          id: ingredient.id,
          name: 'carrot',
          type: 'veg',
          quantity: 5,
          unit: 'unit',
        } as any,
        38
      )
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if a date is poorly formatted', async () => {
    await expect(
      repository.update(
        {
          id: ingredient.id,
          name: 'carrot',
          type: 'veg',
          quantity: 5,
          unit: 'unit',
          purchaseDate: '15/01/2026',
        } as any,
        household.id
      )
    ).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          'value out of range'
        ),
        name: 'error',
        code: '22008',
      })
    )
  })

  it('should throw if there are invalid fields', async () => {
    await expect(
      repository.update(
        {
          id: ingredient.id,
          name: 'carrot',
          type: 'veg',
          quantity: 'n4n',
          unit: 'unit',
        } as any as Updateable<Ingredient>,
        household.id
      )
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

  it('should throw if there are fields that are not in the database', async () => {
    await expect(
      repository.update(
        {
          id: ingredient.id,
          name: 'carrot',
          type: 'veg',
          quantity: 5,
          unit: 'unit',
          newField: 'malevolent hack',
        } as any as Updateable<Ingredient>,
        household.id
      )
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

  it('should throw if the householdId is not valid', async () => {
    await expect(
      repository.update(
        {
          id: ingredient.id,
          name: 'carrot',
          type: 'veg',
          quantity: 5,
        } as any as Updateable<Ingredient>,
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

describe('Deletes an Ingredient', () => {
  it('should delete an ingredient correctly', async () => {
    const result = await repository.delete(
      ingredient.id,
      household.id
    )

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        name: ingredient.name,
        type: ingredient.type,
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

  it('should throw if no record was found in the database for the householdId', async () => {
    await expect(
      repository.delete(ingredient.id, 1312)
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if the householdId is not valid', async () => {
    await expect(
      repository.delete(
        ingredient.id,
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

  it('should throw if the ingredientId is not valid', async () => {
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
})
