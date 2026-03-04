import { wrapInRollbacks } from '@server/tests/utils/transactions/index.js'
import { createTestDatabase } from '@server/tests/utils/testDatabase.js'
import { recipeIngredientRepo } from '@server/repositories/recipeIngredientRepo.js'
import { insertAll } from '@server/tests/utils/records.js'
import {
  fakeHousehold,
  fakeIngredient,
  fakeRcpIngr,
  fakeRecipe,
} from '@server/entities/test/fakes.js'
import { describe, it, expect } from 'vitest'
import type { Insertable } from 'kysely'
import type { RcpIngr } from '@server/database/types.js'

const db = await wrapInRollbacks(
  createTestDatabase()
)

const repository = await recipeIngredientRepo(db)

const [household] = await insertAll(
  db,
  'household',
  [fakeHousehold()]
)

const [recipeOne, recipeTwo, recipeThree] =
  await insertAll(db, 'recipe', [
    fakeRecipe({ householdId: household.id }),
    fakeRecipe({ householdId: household.id }),
    fakeRecipe({ householdId: household.id }),
  ])

const [
  ingredientOne,
  ingredientTwo,
  ingredientThree,
  ingredientFour,
] = await insertAll(db, 'ingredient', [
  fakeIngredient({ householdId: household.id }),
  fakeIngredient({ householdId: household.id }),
  fakeIngredient({ householdId: household.id }),
  fakeIngredient({ householdId: household.id }),
])

describe('Creates a new recipeIngredient', () => {
  it('should create a recipeIngredient correctly', async () => {
    const result = await repository.create({
      recipeId: recipeOne.id,
      ingredientId: ingredientOne.id,
      householdId: household.id,
      amount: 200,
      unit: 'grams',
    })

    expect(result).toBeDefined()
    expect(result).toEqual({
      amount: 200,
      unit: 'grams',
      ingredientId: ingredientOne.id,
      recipeId: recipeOne.id,
      householdId: household.id,
    })
  })

  it('should throw if the unit is not valid', async () => {
    await expect(
      repository.create({
        recipeId: recipeOne.id,
        ingredientId: ingredientOne.id,
        householdId: household.id,
        amount: 2,
        unit: 'kilo',
      })
    )
  })

  it('should throw if no record was found in the database for the recipeId', async () => {
    await expect(
      repository.create({
        recipeId: 1312,
        ingredientId: ingredientOne.id,
        householdId: household.id,
        amount: 200,
        unit: 'grams',
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

  it('should throw if no record was found in the database for the householdId', async () => {
    await expect(
      repository.create({
        recipeId: recipeOne.id,
        ingredientId: ingredientOne.id,
        householdId: 1312,
        amount: 200,
        unit: 'grams',
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

  it('should throw if no record was found in the database for the ingredientId', async () => {
    await expect(
      repository.create({
        recipeId: recipeOne.id,
        ingredientId: 1312,
        householdId: household.id,
        amount: 200,
        unit: 'grams',
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

  it('should throw if a required field is missing', async () => {
    await expect(
      repository.create({
        recipeId: recipeOne.id,
        householdId: household.id,
        amount: 200,
        unit: 'grams',
      } as any as Insertable<RcpIngr>)
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

  it('should throw if the input has too many fields', async () => {
    await expect(
      repository.create({
        recipeId: recipeOne.id,
        ingredientId: ingredientOne.id,
        householdId: household.id,
        amount: 200,
        unit: 'grams',
        newField: 'malevolent hack',
      } as any as Insertable<RcpIngr>)
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
})

describe('Finds a collection of recipeIngredients by recipeId', () => {
  it('should find a collection of recipeIngredients by recipeId correctly', async () => {
    await insertAll(db, 'rcpIngr', [
      fakeRcpIngr({
        householdId: household.id,
        recipeId: recipeOne.id,
        ingredientId: ingredientOne.id,
      }),
      fakeRcpIngr({
        householdId: household.id,
        recipeId: recipeOne.id,
        ingredientId: ingredientTwo.id,
      }),
      fakeRcpIngr({
        householdId: household.id,
        recipeId: recipeOne.id,
        ingredientId: ingredientThree.id,
      }),
      fakeRcpIngr({
        householdId: household.id,
        recipeId: recipeOne.id,
        ingredientId: ingredientFour.id,
      }),
    ])

    const result =
      await repository.findByRecipeId(
        recipeOne.id,
        household.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(4)
  })

  it('should return an empty array id no record was found in the database', async () => {
    const result =
      await repository.findByRecipeId(
        recipeTwo.id,
        household.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should return an empty array if no record was found in the database for the recipeId', async () => {
    const result =
      await repository.findByRecipeId(
        1312,
        household.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should return an empty array if no record was found in the database for the household', async () => {
    const result =
      await repository.findByRecipeId(
        recipeOne.id,
        1312
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })
})

describe('Finds a collection of recipeIngredients by ingredientId', () => {
  it('should find a collection of recipeIngredients by recipeId correctly', async () => {
    await insertAll(db, 'rcpIngr', [
      fakeRcpIngr({
        recipeId: recipeOne.id,
        ingredientId: ingredientOne.id,
        householdId: household.id,
      }),
      fakeRcpIngr({
        recipeId: recipeTwo.id,
        ingredientId: ingredientOne.id,
        householdId: household.id,
      }),
      fakeRcpIngr({
        recipeId: recipeTwo.id,
        ingredientId: ingredientOne.id,
        householdId: household.id,
      }),
      fakeRcpIngr({
        recipeId: recipeThree.id,
        ingredientId: ingredientOne.id,
        householdId: household.id,
      }),
    ])

    const result =
      await repository.findByIngredientId(
        ingredientOne.id,
        household.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(4)
  })

  it('should return an empty array id no record was found in the database', async () => {
    const result =
      await repository.findByIngredientId(
        ingredientTwo.id,
        household.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should return an empty array if no record was found in the database for the ingredientId', async () => {
    const result =
      await repository.findByIngredientId(
        1312,
        household.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should return an empty array if no record was found in the database for the householdId', async () => {
    const result =
      await repository.findByIngredientId(
        ingredientOne.id,
        1312
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })
})

describe('Finds a collection of recipeIngredients with multiple ingredientIds', () => {
  it('should find a collection of recipeIngredients by recipeId correctly', async () => {
    await insertAll(db, 'rcpIngr', [
      fakeRcpIngr({
        ingredientId: ingredientOne.id,
        recipeId: recipeOne.id,
        householdId: household.id,
      }),
      fakeRcpIngr({
        ingredientId: ingredientTwo.id,
        recipeId: recipeOne.id,
        householdId: household.id,
      }),
      fakeRcpIngr({
        ingredientId: ingredientThree.id,
        recipeId: recipeOne.id,
        householdId: household.id,
      }),
      fakeRcpIngr({
        ingredientId: ingredientFour.id,
        recipeId: recipeOne.id,
        householdId: household.id,
      }),
      fakeRcpIngr({
        ingredientId: ingredientTwo.id,
        recipeId: recipeTwo.id,
        householdId: household.id,
      }),
      fakeRcpIngr({
        ingredientId: ingredientThree.id,
        recipeId: recipeTwo.id,
        householdId: household.id,
      }),
      fakeRcpIngr({
        ingredientId: ingredientFour.id,
        recipeId: recipeTwo.id,
        householdId: household.id,
      }),
      fakeRcpIngr({
        ingredientId: ingredientThree.id,
        recipeId: recipeThree.id,
        householdId: household.id,
      }),
      fakeRcpIngr({
        ingredientId: ingredientFour.id,
        recipeId: recipeThree.id,
        householdId: household.id,
      }),
    ])

    const result =
      await repository.findByMultipleIngredientIds(
        [ingredientFour.id, ingredientThree.id],
        household.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(3)
  })

  it('should return an empty array if no record was found', async () => {
    const result =
      await repository.findByMultipleIngredientIds(
        [ingredientFour.id, ingredientThree.id],
        household.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should return an empty array if no record was found for the ingredientId', async () => {
    const result =
      await repository.findByMultipleIngredientIds(
        [1312, 33310],
        household.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should throw if the ID is not valid', async () => {
    await expect(
      repository.findByMultipleIngredientIds(
        ['notAnId' as any, 9],
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

describe('Updates a recipeIngredient', () => {
  it('should update a recipeIngredient correctly', async () => {
    await insertAll(db, 'rcpIngr', [
      fakeRcpIngr({
        ingredientId: ingredientOne.id,
        recipeId: recipeOne.id,
        householdId: household.id,
      }),
    ])

    const result = await repository.update({
      recipeId: recipeOne.id,
      ingredientId: ingredientOne.id,
      householdId: household.id,
      amount: 200,
      unit: 'grams',
    })

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        amount: 200,
        unit: 'grams',
      })
    )
  })

  it('should throw if no record was found', async () => {
    await expect(
      repository.update({
        recipeId: recipeOne.id,
        ingredientId: ingredientOne.id,
        householdId: household.id,
        amount: 200,
        unit: 'grams',
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if no record was found in the database for the recipeId', async () => {
    await expect(
      repository.update({
        recipeId: 1312,
        ingredientId: ingredientOne.id,
        householdId: household.id,
        amount: 200,
        unit: 'grams',
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if no record was found in the database for the householdId', async () => {
    await expect(
      repository.update({
        recipeId: recipeOne.id,
        ingredientId: ingredientOne.id,
        householdId: 1312,
        amount: 200,
        unit: 'grams',
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if no record was found in the database for the ingredientId', async () => {
    await expect(
      repository.update({
        recipeId: recipeOne.id,
        ingredientId: 1312,
        householdId: household.id,
        amount: 200,
        unit: 'grams',
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if the recipeId is not valid', async () => {
    await expect(
      repository.update({
        recipeId: 'notAnId' as any,
        ingredientId: ingredientTwo.id,
        householdId: household.id,
        amount: 200,
        unit: 'grams',
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

  it('should throw if the recipeId is not valid', async () => {
    await expect(
      repository.update({
        recipeId: recipeOne.id,
        ingredientId: 'notAnId' as any,
        householdId: household.id,
        amount: 200,
        unit: 'grams',
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

  it('should throw if the recipeId is not valid', async () => {
    await expect(
      repository.update({
        recipeId: recipeOne.id,
        ingredientId: ingredientOne.id,
        householdId: 'notAnId' as any,
        amount: 200,
        unit: 'grams',
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

describe('Deletes a recipeIngredient', () => {
  it('should delete a recipeIngredient correctly', async () => {
    const [rcpIngr] = await insertAll(
      db,
      'rcpIngr',
      [
        fakeRcpIngr({
          recipeId: recipeOne.id,
          ingredientId: ingredientOne.id,
          householdId: household.id,
        }),
      ]
    )

    const result = await repository.delete(
      recipeOne.id,
      ingredientOne.id,
      household.id
    )

    expect(result).toBeDefined()
    expect(result).toEqual(rcpIngr)
  })

  it('should throw if the recipeId is not valid', async () => {
    await expect(
      repository.delete(
        ingredientOne.id,
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

  it('should throw if the ingredientId is not valid', async () => {
    await expect(
      repository.delete(
        'notAnId' as any,
        recipeOne.id,
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
      repository.delete(
        ingredientOne.id,
        recipeOne.id,
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

  it('should throw if no record was found', async () => {
    await expect(
      repository.delete(
        ingredientOne.id,
        recipeOne.id,
        household.id
      )
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if no record was found for the ingredientId', async () => {
    await expect(
      repository.delete(
        1312,
        recipeOne.id,
        household.id
      )
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if no record was found for the recipeId', async () => {
    await expect(
      repository.delete(
        ingredientOne.id,
        1312,
        household.id
      )
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if no record was found for the recipeId', async () => {
    await expect(
      repository.delete(
        ingredientOne.id,
        recipeOne.id,
        1312
      )
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })
})
