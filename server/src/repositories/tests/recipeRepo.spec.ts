import { wrapInRollbacks } from '@server/tests/utils/transactions/index.js'
import { createTestDatabase } from '@server/tests/utils/testDatabase.js'
import { recipeRepo } from '@server/repositories/recipeRepo.js'
import { describe, expect, it } from 'vitest'
import { insertAll } from '@server/tests/utils/records.js'
import {
  fakeHousehold,
  fakeRecipe,
} from '@server/entities/test/fakes.js'
import type { Recipe } from '@server/database/types.js'
import type {
  Insertable,
  Updateable,
} from 'kysely'

const db = await wrapInRollbacks(
  createTestDatabase()
)

const repository = await recipeRepo(db)

const [household] = await insertAll(
  db,
  'household',
  [fakeHousehold()]
)

const [recipe] = await insertAll(db, 'recipe', [
  fakeRecipe({
    prepTime: 60,
    householdId: household.id,
  }),
])

describe('Creates a new Recipe', () => {
  it('should create a new recipe correctly', async () => {
    const result = await repository.create({
      name: 'Carbonara',
      description:
        'some detailed Carbonara recipe',
      portions: 8,
      prepTime: 30,
      householdId: household.id,
    })

    expect(result).toBeDefined()
    expect(result.name).toBe('Carbonara')
    expect(result.description).toBe(
      'some detailed Carbonara recipe'
    )
    expect(result.portions).toBe(8)
  })

  it('should create a new recipe with nullable fields correctly', async () => {
    const result = await repository.create({
      name: 'Carbonara',
      description:
        'some detailed Carbonara recipe',
      tips: 'some tips',
      portions: 8,
      prepTime: 30,
      img: 'http://someimg.com',
      vid: 'http://somevid.com',
      householdId: household.id,
    })

    expect(result).toBeDefined()
    expect(result.name).toBe('Carbonara')
    expect(result.tips).toBe('some tips')
    expect(result.description).toBe(
      'some detailed Carbonara recipe'
    )
    expect(result.portions).toBe(8)
  })

  it('should create a new pulic recipe correctly', async () => {
    const result = await repository.create({
      name: 'Carbonara',
      description:
        'some detailed Carbonara recipe',
      portions: 8,
      prepTime: 30,
      img: 'http://someimg.com',
      vid: 'http://somevid.com',
      householdId: household.id,
      public: true,
    })

    expect(result).toBeDefined()
    expect(result.name).toBe('Carbonara')
    expect(result.description).toBe(
      'some detailed Carbonara recipe'
    )
    expect(result.portions).toBe(8)
    expect(result.public).toBeTruthy()
  })

  it('should create a new recipe without nullable fields', async () => {
    const result = await repository.create({
      name: 'Carbonara',
      description:
        'some detailed Carbonara recipe',
      portions: 8,
      prepTime: 30,
      householdId: household.id,
    })

    expect(result).toBeDefined()
    expect(result.name).toBe('Carbonara')
    expect(result.description).toBe(
      'some detailed Carbonara recipe'
    )
    expect(result.portions).toBe(8)
    expect(result.public).toBeFalsy()
  })

  it('should throw if no record was found in the database for the householdId', async () => {
    await expect(
      repository.create({
        name: 'Carbonara',
        description:
          'some detailed Carbonara recipe',
        portions: 8,
        prepTime: 30,
        householdId: 1312,
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

  it('should throw if a field is missing', async () => {
    await expect(
      repository.create({
        name: 'Carbonara',
        description:
          'some detailed Carbonara recipe',
        prepTime: 30,
        householdId: household.id,
      } as any as Insertable<Recipe>)
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

  it('should throw if there are fields that are not in the database', async () => {
    await expect(
      repository.create({
        name: 'Carbonara',
        description:
          'some detailed Carbonara recipe',
        portions: 8,
        prepTime: 30,
        householdId: household.id,
        newField: 'malevolant hack',
      } as any as Insertable<Recipe>)
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

describe('Finds a recipe by ID', () => {
  it('should find a recipe by ID correctly', async () => {
    const result = await repository.findById({
      id: recipe.id,
      householdId: household.id,
    })

    expect(result).toBeDefined()
    expect(result.name).toBe(recipe.name)
    expect(result.description).toBe(
      recipe.description
    )
    expect(result.portions).toBe(recipe.portions)
  })

  it('should throw if the recipe does not exist in the database', async () => {
    await expect(
      repository.findById({
        id: 1312,
        householdId: household.id,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if the ID is not valid ', async () => {
    await expect(
      repository.findById({
        id: 'notAnId' as any,
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

  it('should throw if the householdId does not exist in the database', async () => {
    await expect(
      repository.findById({
        id: recipe.id,
        householdId: 1312,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if the householdId is not valid', async () => {
    await expect(
      repository.findById({
        id: recipe.id,
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
})

describe('Finds a collection of recipes by name', () => {
  it('should find a collection of recipe by name correctly', async () => {
    await insertAll(db, 'recipe', [
      fakeRecipe({
        name: 'spaghetti carbonara',
        householdId: household.id,
      }),
      fakeRecipe({
        name: 'carbo',
        householdId: household.id,
      }),
    ])

    const result = await repository.findByName(
      'carbo',
      household.id
    )

    expect(result).toBeDefined()
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe(
      'spaghetti carbonara'
    )
    expect(result[1].name).toBe('carbo')
  })

  it('should return an empty array if no record was found in the database', async () => {
    const result = await repository.findByName(
      'some name',
      household.id
    )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should return an empty array if the householdId is not found', async () => {
    const result = await repository.findByName(
      recipe.name,
      1312
    )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should throw if the householdId is not valid', async () => {
    await expect(
      repository.findByName(
        recipe.name,
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

describe('Finds a collection of recipe by householdId', () => {
  it('should find a collection of recipe by householdId correctly', async () => {
    const [householdTwo] = await insertAll(
      db,
      'household',
      [fakeHousehold()]
    )
    await insertAll(db, 'recipe', [
      fakeRecipe({ householdId: household.id }),
      fakeRecipe({ householdId: household.id }),
      fakeRecipe({
        householdId: householdTwo.id,
      }),
      fakeRecipe({
        householdId: householdTwo.id,
      }),
      fakeRecipe({
        householdId: householdTwo.id,
      }),
    ])

    const result =
      await repository.findByHouseholdId(
        householdTwo.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(3)
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

describe('Finds a collection of recipe by maximum prepTime', () => {
  it('should find a collection of recipe by prepTime', async () => {
    await insertAll(db, 'recipe', [
      fakeRecipe({ householdId: household.id }),
      fakeRecipe({
        householdId: household.id,
        prepTime: 50,
      }),
      fakeRecipe({
        householdId: household.id,
        prepTime: 20,
      }),
      fakeRecipe({
        householdId: household.id,
        prepTime: 30,
      }),
    ])

    const result =
      await repository.findByPrepTime(
        30,
        household.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(2)
  })

  it('should return an empty array if no record was found', async () => {
    const result =
      await repository.findByPrepTime(
        10,
        household.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should return an empty array if no household record was found', async () => {
    const [householdTwo] = await insertAll(
      db,
      'household',
      [fakeHousehold()]
    )
    await insertAll(db, 'recipe', [
      fakeRecipe({
        prepTime: 50,
        householdId: householdTwo.id,
      }),
      fakeRecipe({
        prepTime: 40,
        householdId: householdTwo.id,
      }),
    ])

    const result =
      await repository.findByPrepTime(
        30,
        householdTwo.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })
  it('should throw if the householdId is not valid', async () => {
    await expect(
      repository.findByPrepTime(
        30,
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

describe('Finds a collection of public recipe', () => {
  it('should find a collection of public recipe correctly', async () => {
    const [householdTwo, householdThree] =
      await insertAll(db, 'household', [
        fakeHousehold(),
        fakeHousehold(),
      ])
    await insertAll(db, 'recipe', [
      fakeRecipe({
        householdId: household.id,
        public: true,
      }),
      fakeRecipe({
        householdId: householdTwo.id,
        public: true,
      }),
      fakeRecipe({
        householdId: householdThree.id,
        public: true,
      }),
      fakeRecipe({
        householdId: household.id,
        public: false,
      }),
      fakeRecipe({
        householdId: householdThree.id,
      }),
    ])

    const result =
      await repository.findAllPublicRecipe()

    expect(result).toBeDefined()
    expect(result).toHaveLength(3)
  })

  it('should return an empty array if no record were found', async () => {
    const result =
      await repository.findAllPublicRecipe()

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })
})

describe('Finds a collection of public recipe by household', () => {
  it('should find a collection of public recipe by household correctly', async () => {
    const [householdTwo, householdThree] =
      await insertAll(db, 'household', [
        fakeHousehold(),
        fakeHousehold(),
      ])
    await insertAll(db, 'recipe', [
      fakeRecipe({
        householdId: household.id,
        public: true,
      }),
      fakeRecipe({
        householdId: householdTwo.id,
        public: true,
      }),
      fakeRecipe({
        householdId: householdThree.id,
        public: true,
      }),
      fakeRecipe({
        householdId: household.id,
        public: true,
      }),
      fakeRecipe({
        householdId: householdThree.id,
      }),
    ])

    const result =
      await repository.findAllPublicRecipeByHousehold(
        household.id
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
      await repository.findAllPublicRecipeByHousehold(
        householdTwo.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should return an empty array if no household record was found', async () => {
    const result =
      await repository.findAllPublicRecipeByHousehold(
        1312
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should throw if the householdId is not valid', async () => {
    await expect(
      repository.findAllPublicRecipeByHousehold(
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

describe('Updates a recipe', () => {
  it('should update a recipe correctly', async () => {
    const result = await repository.update(
      {
        id: recipe.id,
        prepTime: 100,
        name: 'carbonara',
      } as any as Updateable<Recipe>,
      household.id
    )

    expect(result).toBeDefined()
    expect(result.name).toBe('carbonara')
    expect(result.prepTime).toBe(100)
  })

  it('should update a recipe to public correctly', async () => {
    const result = await repository.update(
      {
        id: recipe.id,
        prepTime: 100,
        name: 'carbonara',
        public: true,
      } as any as Updateable<Recipe>,
      household.id
    )

    expect(result).toBeDefined()
    expect(result.name).toBe('carbonara')
    expect(result.prepTime).toBe(100)
    expect(result.public).toBeTruthy()
  })

  it('should update a recipe to not public correctly', async () => {
    const [specialRecipe] = await insertAll(
      db,
      'recipe',
      [
        fakeRecipe({
          householdId: household.id,
          public: true,
        }),
      ]
    )

    const result = await repository.update(
      {
        id: specialRecipe.id,
        prepTime: 100,
        name: 'carbonara',
        public: false,
      } as any as Updateable<Recipe>,
      household.id
    )

    expect(result).toBeDefined()
    expect(result.name).toBe('carbonara')
    expect(result.prepTime).toBe(100)
    expect(result.public).toBeFalsy()
  })

  it('should throw if no record was found in the database', async () => {
    await expect(
      repository.update(
        {
          id: 1312,
          prepTime: 100,
          name: 'carbonara',
        } as any as Updateable<Recipe>,
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
          id: recipe.id,
          prepTime: 100,
          name: 'carbonara',
        } as any as Updateable<Recipe>,
        1312
      )
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if there are invalid fields', async () => {
    await expect(
      repository.update(
        {
          id: recipe.id,
          name: 1312,
          prepTime: 'n4n',
        } as any as Updateable<Recipe>,
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
          id: recipe.id,
          name: 'carbo',
          prepTime: 20,
          newField: 'malevolent hack',
        } as any as Updateable<Recipe>,
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
          id: recipe.id,
          name: 'carbo',
          prepTime: 20,
        } as any as Updateable<Recipe>,
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

describe('Deletes a recipe', () => {
  it('should delete a recipe correctly', async () => {
    const result = await repository.delete({
      id: recipe.id,
      householdId: household.id,
    })

    expect(result).toBeDefined()
    expect(result.name).toBe(recipe.name)
    expect(result.description).toBe(
      recipe.description
    )
    expect(result.prepTime).toBe(recipe.prepTime)
  })

  it('should throw if no record was found in the database', async () => {
    await expect(
      repository.delete({
        id: 1312,
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
      repository.delete({
        id: recipe.id,
        householdId: 1312,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if the householdId is not valid', async () => {
    await expect(
      repository.delete({
        id: recipe.id,
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
})
