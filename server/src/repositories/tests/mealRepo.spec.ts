import { wrapInRollbacks } from '@server/tests/utils/transactions/index.js'
import { createTestDatabase } from '@server/tests/utils/testDatabase.js'
import { mealRepo } from '@server/repositories/mealRepo.js'
import { insertAll } from '@server/tests/utils/records.js'
import {
  aWeekAgo,
  closeExpiryDate,
  fakeHomeMeal,
  fakeHousehold,
  fakeOutsideMeal,
  fakeRecipe,
  longExpiryDate,
  someDaysAgo,
} from '@server/entities/test/fakes.js'
import { describe, expect, it } from 'vitest'
import type { Insertable } from 'kysely'
import type { Meal } from '@server/database/index.js'

const db = await wrapInRollbacks(
  createTestDatabase()
)

const repository = await mealRepo(db)

const [household] = await insertAll(
  db,
  'household',
  [fakeHousehold()]
)

const [recipe] = await insertAll(db, 'recipe', [
  fakeRecipe({
    householdId: household.id,
  }),
])

const [outsideMeal] = await insertAll(
  db,
  'meal',
  [
    fakeOutsideMeal({
      householdId: household.id,
      outsideMeal: "Joe's Pizza",
    }),
  ]
)

const [homeMeal] = await insertAll(db, 'meal', [
  fakeHomeMeal({
    householdId: household.id,
    recipeId: recipe.id,
  }),
])

describe('Creates new Meal', () => {
  it('should create a new home meal correctly', async () => {
    const result = await repository.create({
      portions: 4,
      recipeId: recipe.id,
      eatingDate: new Date('2026-02-02'),
      householdId: household.id,
    })

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        eatingDate: new Date('2026-02-02'),
        recipeId: recipe.id,
        portions: 4,
        outsideMeal: null,
      })
    )
  })

  it('should create an outside meal correctly', async () => {
    const result = await repository.create({
      portions: 4,
      householdId: household.id,
      eatingDate: new Date('2026-02-02'),
      outsideMeal: "Joe's Pizza",
    })

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        eatingDate: new Date('2026-02-02'),
        recipeId: null,
        portions: 4,
        outsideMeal: `Joe's Pizza`,
      })
    )
  })

  it('should create an undecided meal correctly', async () => {
    const result = await repository.create({
      portions: 4,
      householdId: household.id,
      eatingDate: new Date('2026-02-02'),
    })

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        eatingDate: new Date('2026-02-02'),
        recipeId: null,
        portions: 4,
        outsideMeal: null,
      })
    )
  })

  it('should throw if no record was found in the database for the householdId', async () => {
    await expect(
      repository.create({
        portions: 4,
        householdId: 1312,
        eatingDate: new Date('2026-02-02'),
        outsideMeal: "Joe's Pizza",
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

  it('should throw if no record was found in the database for the recipeId', async () => {
    await expect(
      repository.create({
        portions: 4,
        householdId: household.id,
        eatingDate: new Date('2026-02-02'),
        recipeId: 1312,
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

  it('should throw if a field is missing', async () => {
    await expect(
      repository.create({
        householdId: household.id,
        portions: 4,
      } as any as Insertable<Meal>)
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
        householdId: household.id,
        portions: 4,
        eatingDate: new Date('2026-02-02'),
        recipeId: recipe.id,
        newField: 'malevolent hack',
      } as any as Insertable<Meal>)
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

  it('should throw if the date is not valid', async () => {
    await expect(
      repository.create({
        householdId: household.id,
        portions: 4,
        eatingDate: '2026-31-12',
        recipeId: recipe.id,
      } as any as Insertable<Meal>)
    ).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          'field value out of range'
        ),
        code: '22008',
        name: 'error',
      })
    )
  })

  it('should throw if the householdId is not valid', async () => {
    await expect(
      repository.create({
        householdId: 'notAnId',
        portions: 4,
        eatingDate: new Date('2026-02-02'),
        recipeId: recipe.id,
      } as any as Insertable<Meal>)
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
      repository.create({
        householdId: household.id,
        portions: 4,
        eatingDate: new Date('2026-02-02'),
        recipeId: 'notAnId',
      } as any as Insertable<Meal>)
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

describe('Finds a Meal by ID', () => {
  it('should find a meal by ID correctly', async () => {
    const result = await repository.findById(
      homeMeal.id,
      household.id
    )

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        eatingDate: homeMeal.eatingDate,
        outsideMeal: null,
        portions: homeMeal.portions,
        recipeId: homeMeal.recipeId,
      })
    )
  })

  it('should throw if the recipe does not exist in the database', async () => {
    await expect(
      repository.findById(1312, household.id)
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

  it('should throw if the householdId does not exist in the database', async () => {
    await expect(
      repository.findById(homeMeal.id, 1312)
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if the householdId is not valid', async () => {
    await expect(
      repository.findById(
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
})

describe('Finds a collection of meals by recipeId', () => {
  it('should find a collection of meals by recipeId correctly', async () => {
    await insertAll(db, 'meal', [
      fakeHomeMeal({
        householdId: household.id,
        recipeId: recipe.id,
      }),
      fakeOutsideMeal({
        householdId: household.id,
      }),
      fakeOutsideMeal({
        householdId: household.id,
      }),
      fakeOutsideMeal({
        householdId: household.id,
      }),
    ])

    const result =
      await repository.findByRecipeId(
        recipe.id,
        household.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(2)
  })

  it('should return an empty array if no record was found for the recipeId', async () => {
    const result =
      await repository.findByRecipeId(
        1312,
        household.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should return an empty array if no record was found', async () => {
    const [recipeTwo] = await insertAll(
      db,
      'recipe',
      [fakeRecipe({ householdId: household.id })]
    )

    const result =
      await repository.findByRecipeId(
        recipeTwo.id,
        household.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should return an empty array if no record was found with the householdId', async () => {
    const result =
      await repository.findByRecipeId(
        recipe.id,
        1312
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should throw if the recipeId is not valid', async () => {
    await expect(
      repository.findByRecipeId(
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
      repository.findByRecipeId(
        recipe.id,
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

describe('Finds a collection of Meals by householdId', () => {
  it('should find a collection of meals by householdId correctly', async () => {
    const [householdTwo] = await insertAll(
      db,
      'household',
      [fakeHousehold()]
    )

    await insertAll(db, 'meal', [
      fakeHomeMeal({
        recipeId: recipe.id,
        householdId: household.id,
      }),
      fakeHomeMeal({
        recipeId: recipe.id,
        householdId: householdTwo.id,
      }),
      fakeOutsideMeal({
        recipeId: recipe.id,
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

  it('should return an empty array if no record was found', async () => {
    const [householdTwo] = await insertAll(
      db,
      'household',
      [fakeHousehold()]
    )

    const result =
      await repository.findByHouseholdId(
        householdTwo.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should return an empty array if no household record was found', async () => {
    const result =
      await repository.findByHouseholdId(1312)

    expect(result).toBeDefined()
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

describe('Finds a collection of passed Meals', () => {
  it('should find a collection of passed meals', async () => {
    await insertAll(db, 'meal', [
      fakeHomeMeal({
        recipeId: recipe.id,
        householdId: household.id,
        eatingDate: someDaysAgo(),
      }),
      fakeHomeMeal({
        recipeId: recipe.id,
        householdId: household.id,
        eatingDate: aWeekAgo(),
      }),
      fakeOutsideMeal({
        householdId: household.id,
        eatingDate: aWeekAgo(),
      }),
      fakeOutsideMeal({
        householdId: household.id,
        eatingDate: closeExpiryDate(),
      }),
      fakeHomeMeal({
        householdId: household.id,
        recipeId: recipe.id,
        eatingDate: longExpiryDate(),
      }),
    ])

    const result =
      await repository.findPassedMeals(
        household.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(3)
  })

  it('should return an empty array if no record was found', async () => {
    const result =
      await repository.findPassedMeals(1312)

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should return an empty array if no record was found for the householdId', async () => {
    const [householdTwo] = await insertAll(
      db,
      'household',
      [fakeHousehold()]
    )

    const result =
      await repository.findPassedMeals(
        householdTwo.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should throw if the householdId is not valid', async () => {
    await expect(
      repository.findPassedMeals('notAnId' as any)
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

describe('Finds a collection of future Meals', () => {
  it('should find a collection of future meals correctly', async () => {
    await insertAll(db, 'meal', [
      fakeHomeMeal({
        recipeId: recipe.id,
        householdId: household.id,
        eatingDate: someDaysAgo(),
      }),
      fakeHomeMeal({
        recipeId: recipe.id,
        householdId: household.id,
        eatingDate: aWeekAgo(),
      }),
      fakeOutsideMeal({
        householdId: household.id,
        eatingDate: aWeekAgo(),
      }),
      fakeOutsideMeal({
        householdId: household.id,
        eatingDate: closeExpiryDate(),
      }),
      fakeHomeMeal({
        householdId: household.id,
        recipeId: recipe.id,
        eatingDate: longExpiryDate(),
      }),
    ])

    const result =
      await repository.findFutureMeals(
        household.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(4)
  })

  it('should return an empty array if no record was found', async () => {
    const result =
      await repository.findFutureMeals(1312)

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should return an empty array if no record was found for the householdId', async () => {
    const [householdTwo] = await insertAll(
      db,
      'household',
      [fakeHousehold()]
    )

    const result =
      await repository.findFutureMeals(
        householdTwo.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should throw if the householdId is not valid', async () => {
    await expect(
      repository.findFutureMeals('notAnId' as any)
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

describe('Finds a collection of passed homemade Meals', () => {
  it('should find a collection of passed homemade meals correctly', async () => {
    await insertAll(db, 'meal', [
      fakeHomeMeal({
        householdId: household.id,
        recipeId: recipe.id,
        eatingDate: aWeekAgo(),
      }),
      fakeHomeMeal({
        householdId: household.id,
        recipeId: recipe.id,
        eatingDate: someDaysAgo(),
      }),
      fakeOutsideMeal({
        householdId: household.id,
        eatingDate: aWeekAgo(),
      }),
      fakeOutsideMeal({
        householdId: household.id,
        eatingDate: aWeekAgo(),
      }),
    ])

    const result =
      await repository.findPassedHomeMeals(
        household.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(2)
  })

  it('should return an empty array if no record was found', async () => {
    const result =
      await repository.findPassedHomeMeals(1312)

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should return an empty array if no record was found for the householdId', async () => {
    const [householdTwo] = await insertAll(
      db,
      'household',
      [fakeHousehold()]
    )

    const result =
      await repository.findPassedHomeMeals(
        householdTwo.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should throw if the householdId is not valid', async () => {
    await expect(
      repository.findPassedHomeMeals(
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

describe('Finds a collection of future homemade Meals', () => {
  it('should find a collection of passed homemade meals correctly', async () => {
    await insertAll(db, 'meal', [
      fakeHomeMeal({
        householdId: household.id,
        recipeId: recipe.id,
        eatingDate: longExpiryDate(),
      }),
      fakeHomeMeal({
        householdId: household.id,
        recipeId: recipe.id,
        eatingDate: closeExpiryDate(),
      }),
      fakeOutsideMeal({
        householdId: household.id,
        eatingDate: longExpiryDate(),
      }),
      fakeOutsideMeal({
        householdId: household.id,
        eatingDate: closeExpiryDate(),
      }),
    ])

    const result =
      await repository.findFutureHomeMeals(
        household.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(3)
  })

  it('should return an empty array if no record was found', async () => {
    const result =
      await repository.findFutureHomeMeals(1312)

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should return an empty array if no record was found for the householdId', async () => {
    const [householdTwo] = await insertAll(
      db,
      'household',
      [fakeHousehold()]
    )

    const result =
      await repository.findFutureHomeMeals(
        householdTwo.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should throw if the householdId is not valid', async () => {
    await expect(
      repository.findFutureHomeMeals(
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

describe('Finds a collection of passed outside Meals', () => {
  it('should find a collection of passed outside meals correctly', async () => {
    await insertAll(db, 'meal', [
      fakeHomeMeal({
        householdId: household.id,
        recipeId: recipe.id,
        eatingDate: someDaysAgo(),
      }),
      fakeHomeMeal({
        householdId: household.id,
        recipeId: recipe.id,
        eatingDate: aWeekAgo(),
      }),
      fakeOutsideMeal({
        householdId: household.id,
        eatingDate: someDaysAgo(),
      }),
      fakeOutsideMeal({
        householdId: household.id,
        eatingDate: aWeekAgo(),
      }),
    ])

    const result =
      await repository.findPassedOutsideMeals(
        household.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(2)
  })

  it('should return an empty array if no record was found', async () => {
    const result =
      await repository.findPassedOutsideMeals(
        1312
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should return an empty array if no record was found for the householdId', async () => {
    const [householdTwo] = await insertAll(
      db,
      'household',
      [fakeHousehold()]
    )

    const result =
      await repository.findPassedOutsideMeals(
        householdTwo.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should throw if the householdId is not valid', async () => {
    await expect(
      repository.findPassedOutsideMeals(
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

describe('Finds a collection of future outside Meals', () => {
  it('should find a collection of future outside meals correctly', async () => {
    await insertAll(db, 'meal', [
      fakeHomeMeal({
        householdId: household.id,
        recipeId: recipe.id,
        eatingDate: closeExpiryDate(),
      }),
      fakeHomeMeal({
        householdId: household.id,
        recipeId: recipe.id,
        eatingDate: longExpiryDate(),
      }),
      fakeOutsideMeal({
        householdId: household.id,
        eatingDate: closeExpiryDate(),
      }),
      fakeOutsideMeal({
        householdId: household.id,
        eatingDate: longExpiryDate(),
      }),
    ])

    const result =
      await repository.findFutureOutsideMeals(
        household.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(3)
  })

  it('should return an empty array if no record was found', async () => {
    const result =
      await repository.findFutureOutsideMeals(
        1312
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should return an empty array if no record was found for the householdId', async () => {
    const [householdTwo] = await insertAll(
      db,
      'household',
      [fakeHousehold()]
    )

    const result =
      await repository.findFutureOutsideMeals(
        householdTwo.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should throw if the householdId is not valid', async () => {
    await expect(
      repository.findFutureOutsideMeals(
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
