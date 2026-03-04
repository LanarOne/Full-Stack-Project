import { wrapInRollbacks } from '@server/tests/utils/transactions/index.js'
import { createTestDatabase } from '@server/tests/utils/testDatabase.js'
import { participantRepo } from '@server/repositories/participantRepo.js'
import { insertAll } from '@server/tests/utils/records.js'
import {
  fakeHomeMeal,
  fakeHousehold,
  fakeOutsideMeal,
  fakeParticipant,
  fakeRecipe,
  fakeUser,
} from '@server/entities/test/fakes.js'
import { describe, it, expect } from 'vitest'
import type { Insertable } from 'kysely'
import type { Participant } from '@server/database/types.js'

const db = await wrapInRollbacks(
  createTestDatabase()
)

const repository = await participantRepo(db)

const [household] = await insertAll(
  db,
  'household',
  [fakeHousehold()]
)

const [userOne, userTwo, userThree] =
  await insertAll(db, 'user', [
    fakeUser(),
    fakeUser(),
    fakeUser(),
  ])

const [recipe] = await insertAll(db, 'recipe', [
  fakeRecipe({ householdId: household.id }),
])

const [homeMeal] = await insertAll(db, 'meal', [
  fakeHomeMeal({
    householdId: household.id,
    recipeId: recipe.id,
  }),
])

const [outsideMeal] = await insertAll(
  db,
  'meal',
  [fakeOutsideMeal({ householdId: household.id })]
)

describe('Creates a new Participant', () => {
  it('should create a new participant without nullable fields correctly', async () => {
    const result = await repository.create({
      userId: userOne.id,
      mealId: outsideMeal.id,
      attended: false,
    })

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        userId: userOne.id,
        mealId: outsideMeal.id,
        attended: false,
      })
    )
  })

  it('should create a new participant with nullable fields correctly', async () => {
    const result = await repository.create({
      userId: userOne.id,
      mealId: outsideMeal.id,
      attended: false,
      confirmation: true,
    })

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        userId: userOne.id,
        mealId: outsideMeal.id,
        attended: false,
        confirmation: true,
      })
    )
  })

  it('should throw if no record was found in the database for the userId', async () => {
    await expect(
      repository.create({
        userId: 1312,
        mealId: outsideMeal.id,
        attended: false,
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

  it('should throw if no record was found in the database for the userId', async () => {
    await expect(
      repository.create({
        userId: userOne.id,
        mealId: 1312,
        attended: false,
        confirmation: true,
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

  it('should throw if the userId is not valid', async () => {
    await expect(
      repository.create({
        userId: 'notAnId' as any,
        mealId: homeMeal.id,
        attended: false,
        confirmation: true,
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

  it('should throw if the mealId is not valid', async () => {
    await expect(
      repository.create({
        userId: userOne.id,
        mealId: 'notAnId' as any,
        attended: false,
        confirmation: true,
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

  it('should throw if the confirmation is not valid', async () => {
    await expect(
      repository.create({
        userId: userOne.id,
        mealId: homeMeal.id,
        attended: false,
        confirmation: 1312 as any,
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

  it('should throw if attended is not valid', async () => {
    await expect(
      repository.create({
        userId: userOne.id,
        mealId: homeMeal.id,
        attended: null as any,
        confirmation: true,
      })
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
        userId: userOne.id,
        mealId: outsideMeal,
        attended: false,
        confirmation: true,
        newField: 'malevolent hack',
      } as any as Insertable<Participant>)
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
        mealId: outsideMeal,
        confirmation: true,
      } as any as Insertable<Participant>)
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

describe('Finds a Participant', () => {
  it('should find a participant correctly', async () => {
    await insertAll(db, 'participant', [
      fakeParticipant({
        userId: userOne.id,
        mealId: homeMeal.id,
      }),
    ])

    const result = await repository.findOne(
      userOne.id,
      homeMeal.id
    )

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        userId: userOne.id,
        mealId: homeMeal.id,
      })
    )
  })

  it('should throw if the userId is not valid', async () => {
    await expect(
      repository.findOne(
        'user.id' as any,
        homeMeal.id
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

  it('should throw if the mealId is not valid', async () => {
    await expect(
      repository.findOne(
        userOne.id,
        'homeMeal.id' as any
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

  it('should throw if no record was found in the database for the userId', async () => {
    await expect(
      repository.findOne(1312, homeMeal.id)
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if no record was found in the database for the mealId', async () => {
    await expect(
      repository.findOne(userOne.id, 1312)
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if no record was found in the database', async () => {
    await expect(
      repository.findOne(
        userOne.id,
        outsideMeal.id
      )
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })
})

describe('Finds a collection of Participant by mealId', () => {
  it('should find a collection of participants by mealId correctly', async () => {
    await insertAll(db, 'participant', [
      fakeParticipant({
        userId: userOne.id,
        mealId: homeMeal.id,
      }),
      fakeParticipant({
        userId: userTwo.id,
        mealId: homeMeal.id,
      }),
      fakeParticipant({
        userId: userThree.id,
        mealId: homeMeal.id,
      }),
    ])

    const result = await repository.findByMealId(
      homeMeal.id
    )

    expect(result).toBeDefined()
    expect(result).toHaveLength(3)
  })

  it('should throw if the mealId is not valid', async () => {
    await expect(
      repository.findByMealId('meal.id' as any)
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

  it('should return an empty array if no record was found in the database for the mealId', async () => {
    const result =
      await repository.findByMealId(1312)

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should return an empty array if no record was found in the database', async () => {
    const result = await repository.findByMealId(
      outsideMeal.id
    )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })
})

describe('Finds a collection of Meals by userId', () => {
  it('should find a collection of meals by userId correctly', async () => {
    const [homeMealTwo] = await insertAll(
      db,
      'meal',
      [
        fakeHomeMeal({
          recipeId: recipe.id,
          householdId: household.id,
        }),
      ]
    )

    await insertAll(db, 'participant', [
      fakeParticipant({
        userId: userOne.id,
        mealId: homeMeal.id,
      }),
      fakeParticipant({
        userId: userOne.id,
        mealId: outsideMeal.id,
      }),
      fakeParticipant({
        userId: userOne.id,
        mealId: homeMealTwo.id,
      }),
    ])

    const result = await repository.findByUserId(
      userOne.id
    )

    expect(result).toBeDefined()
    expect(result).toHaveLength(3)
  })

  it('should throw if the userId is not valid', async () => {
    await expect(
      repository.findByUserId('user.id' as any)
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

  it('should return an empty array if no record was found in the database for the userId', async () => {
    const result =
      await repository.findByUserId(1312)

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should return an empty array if no record was found in the database', async () => {
    const result = await repository.findByUserId(
      userOne.id
    )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })
})

describe('Finds Unconfirmed participants for a Meal', () => {
  it('should find a collection of unconfirmed participants by mealId correctly', async () => {
    await insertAll(db, 'participant', [
      fakeParticipant({
        userId: userOne.id,
        mealId: homeMeal.id,
        confirmation: null,
      }),
      fakeParticipant({
        userId: userTwo.id,
        mealId: homeMeal.id,
        confirmation: null,
      }),
      fakeParticipant({
        userId: userThree.id,
        mealId: homeMeal.id,
        confirmation: true,
      }),
    ])

    const result =
      await repository.findUnconfirmed(
        homeMeal.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(2)
  })

  it('should throw if the mealId is not valid', async () => {
    await expect(
      repository.findUnconfirmed('meal.id' as any)
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

  it('should return an empty array if no record was found in the database for the mealId', async () => {
    const result =
      await repository.findUnconfirmed(1312)

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should return an empty array if no record was found in the database', async () => {
    const result =
      await repository.findUnconfirmed(
        outsideMeal.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })
})

describe('Finds Confirmed participants for a Meal', () => {
  it('should find a collection of confirmed participants by mealId correctly', async () => {
    await insertAll(db, 'participant', [
      fakeParticipant({
        userId: userOne.id,
        mealId: homeMeal.id,
        confirmation: true,
      }),
      fakeParticipant({
        userId: userTwo.id,
        mealId: homeMeal.id,
        confirmation: null,
      }),
      fakeParticipant({
        userId: userThree.id,
        mealId: homeMeal.id,
        confirmation: true,
      }),
    ])

    const result =
      await repository.findConfirmedYes(
        homeMeal.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(2)
  })

  it('should throw if the mealId is not valid', async () => {
    await expect(
      repository.findConfirmedYes(
        'meal.id' as any
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

  it('should return an empty array if no record was found in the database for the mealId', async () => {
    const result =
      await repository.findConfirmedYes(1312)

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should return an empty array if no record was found in the database', async () => {
    const result =
      await repository.findConfirmedYes(
        outsideMeal.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })
})

describe('Finds Confirmed non-participants for a Meal', () => {
  it('should find a collection of confirmed non-participants by mealId correctly', async () => {
    await insertAll(db, 'participant', [
      fakeParticipant({
        userId: userOne.id,
        mealId: homeMeal.id,
        confirmation: false,
      }),
      fakeParticipant({
        userId: userTwo.id,
        mealId: homeMeal.id,
        confirmation: null,
      }),
      fakeParticipant({
        userId: userThree.id,
        mealId: homeMeal.id,
        confirmation: false,
      }),
    ])

    const result =
      await repository.findConfirmedNo(
        homeMeal.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(2)
  })

  it('should throw if the mealId is not valid', async () => {
    await expect(
      repository.findConfirmedNo('meal.id' as any)
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

  it('should return an empty array if no record was found in the database for the mealId', async () => {
    const result =
      await repository.findConfirmedNo(1312)

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should return an empty array if no record was found in the database', async () => {
    const result =
      await repository.findConfirmedNo(
        outsideMeal.id
      )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })
})

describe('Finds Participant that attended a Meal', () => {
  it('should find a collection of participants that attended a meal correctly', async () => {
    await insertAll(db, 'participant', [
      fakeParticipant({
        userId: userOne.id,
        mealId: homeMeal.id,
        confirmation: true,
        attended: true,
      }),
      fakeParticipant({
        userId: userTwo.id,
        mealId: homeMeal.id,
        confirmation: null,
        attended: true,
      }),
      fakeParticipant({
        userId: userThree.id,
        mealId: homeMeal.id,
        confirmation: false,
        attended: false,
      }),
    ])

    const result = await repository.findAttended(
      homeMeal.id
    )

    expect(result).toBeDefined()
    expect(result).toHaveLength(2)
  })

  it('should throw if the mealId is not valid', async () => {
    await expect(
      repository.findAttended('meal.id' as any)
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

  it('should return an empty array if no record was found in the database for the mealId', async () => {
    const result =
      await repository.findAttended(1312)

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })

  it('should return an empty array if no record was found in the database', async () => {
    const result = await repository.findAttended(
      outsideMeal.id
    )

    expect(result).toBeDefined()
    expect(result).toHaveLength(0)
  })
})

describe('Updates A Participant', () => {
  it('should update a participant correctly', async () => {
    await insertAll(db, 'participant', [
      fakeParticipant({
        userId: userOne.id,
        mealId: outsideMeal.id,
      }),
    ])

    const result = await repository.update({
      userId: userOne.id,
      mealId: outsideMeal.id,
      attended: true,
      confirmation: true,
    })

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        userId: userOne.id,
        mealId: outsideMeal.id,
        attended: true,
        confirmation: true,
      })
    )
  })

  it('should update a single field in a participant correctly', async () => {
    await insertAll(db, 'participant', [
      fakeParticipant({
        userId: userOne.id,
        mealId: outsideMeal.id,
      }),
    ])

    const result = await repository.update({
      userId: userOne.id,
      mealId: outsideMeal.id,
      confirmation: true,
    })

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        userId: userOne.id,
        mealId: outsideMeal.id,
        attended: false,
        confirmation: true,
      })
    )
  })

  it('should throw if no record was found in the database for the userId', async () => {
    await expect(
      repository.update({
        userId: 1312,
        mealId: outsideMeal.id,
        attended: false,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if no record was found in the database for the mealId', async () => {
    await expect(
      repository.update({
        userId: userOne.id,
        mealId: 1312,
        attended: false,
        confirmation: true,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if the userId is not valid', async () => {
    await expect(
      repository.update({
        userId: 'notAnId' as any,
        mealId: homeMeal.id,
        attended: false,
        confirmation: true,
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

  it('should throw if the mealId is not valid', async () => {
    await expect(
      repository.update({
        userId: userOne.id,
        mealId: 'notAnId' as any,
        attended: false,
        confirmation: true,
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

  it('should throw if the confirmation is not valid', async () => {
    await expect(
      repository.update({
        userId: userOne.id,
        mealId: homeMeal.id,
        attended: false,
        confirmation: 1312 as any,
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

  it('should throw if attended is not valid', async () => {
    await expect(
      repository.update({
        userId: userOne.id,
        mealId: outsideMeal.id,
        attended: null as any,
        confirmation: true,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if there are fields that are not in the database', async () => {
    await expect(
      repository.update({
        userId: userOne.id,
        mealId: outsideMeal,
        attended: false,
        confirmation: true,
        newField: 'malevolent hack',
      } as any as Insertable<Participant>)
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

describe('Deletes Participant', () => {
  it('should delete participant correctly', async () => {
    await insertAll(db, 'participant', [
      fakeParticipant({
        userId: userOne.id,
        mealId: outsideMeal.id,
      }),
    ])

    const result = await repository.delete({
      userId: userOne.id,
      mealId: outsideMeal.id,
    })

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        userId: userOne.id,
        mealId: outsideMeal.id,
      })
    )
  })

  it('should throw if no record was found in the database for the userId', async () => {
    await expect(
      repository.delete({
        userId: 1312,
        mealId: outsideMeal.id,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if no record was found in the database for the mealId', async () => {
    await expect(
      repository.delete({
        userId: userOne.id,
        mealId: 1312,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if the userId is not valid', async () => {
    await expect(
      repository.delete({
        userId: 'notAnId' as any,
        mealId: homeMeal.id,
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

  it('should throw if the userId is not valid', async () => {
    await expect(
      repository.delete({
        userId: userOne.id,
        mealId: 'notAnId' as any,
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
      repository.delete({
        userId: userOne.id,
        mealId: outsideMeal.id,
        newField: 'malevolent hack',
      } as any as Partial<Participant>)
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'no result',
      })
    )
  })

  it('should throw if a field is missing', async () => {
    await expect(
      repository.delete({
        mealId: outsideMeal.id,
      } as any as Partial<Participant>)
    ).rejects.toThrow(
      expect.objectContaining({
        message: expect.objectContaining(
          /invalid input syntax/i
        ),
      })
    )
  })
})
