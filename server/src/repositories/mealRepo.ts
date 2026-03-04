import type {
  Database,
  Meal,
} from '@server/database/index.js'
import type { Insertable } from 'kysely'
import {
  mealKeysPublic,
  type MealPublic,
} from '@server/entities/meal.js'

export function mealRepo(db: Database) {
  return {
    async create(
      meal: Insertable<Meal>
    ): Promise<MealPublic> {
      return db
        .insertInto('meal')
        .values(meal)
        .returning(mealKeysPublic)
        .executeTakeFirstOrThrow()
    },

    async findById(
      id: number,
      householdId: number
    ): Promise<MealPublic> {
      return db
        .selectFrom('meal')
        .select(mealKeysPublic)
        .where('id', '=', id)
        .where('householdId', '=', householdId)
        .executeTakeFirstOrThrow()
    },

    async findByRecipeId(
      recipeId: number,
      householdId: number
    ): Promise<MealPublic[]> {
      return db
        .selectFrom('meal')
        .select(mealKeysPublic)
        .where('recipeId', '=', recipeId)
        .where('householdId', '=', householdId)
        .execute()
    },
    async findByHouseholdId(
      householdId: number
    ): Promise<MealPublic[]> {
      return db
        .selectFrom('meal')
        .select(mealKeysPublic)
        .where('householdId', '=', householdId)
        .execute()
    },
    async findPassedMeals(
      householdId: number
    ): Promise<MealPublic[]> {
      const now = new Date()

      return db
        .selectFrom('meal')
        .select(mealKeysPublic)
        .where('householdId', '=', householdId)
        .where('eatingDate', '<=', now)
        .execute()
    },

    async findFutureMeals(
      householdId: number
    ): Promise<MealPublic[]> {
      const now = new Date()

      return db
        .selectFrom('meal')
        .select(mealKeysPublic)
        .where('householdId', '=', householdId)
        .where('eatingDate', '>=', now)
        .execute()
    },

    async findPassedHomeMeals(
      householdId: number
    ): Promise<MealPublic[]> {
      const now = new Date()

      return db
        .selectFrom('meal')
        .select(mealKeysPublic)
        .where('householdId', '=', householdId)
        .where('eatingDate', '<=', now)
        .where('recipeId', 'is not', null)
        .execute()
    },

    async findFutureHomeMeals(
      householdId: number
    ): Promise<MealPublic[]> {
      const now = new Date()

      return db
        .selectFrom('meal')
        .select(mealKeysPublic)
        .where('householdId', '=', householdId)
        .where('eatingDate', '>=', now)
        .where('recipeId', 'is not', null)
        .execute()
    },

    async findPassedOutsideMeals(
      householdId: number
    ): Promise<MealPublic[]> {
      const now = new Date()

      return db
        .selectFrom('meal')
        .select(mealKeysPublic)
        .where('householdId', '=', householdId)
        .where('eatingDate', '<=', now)
        .where('outsideMeal', 'is not', null)
        .execute()
    },

    async findFutureOutsideMeals(
      householdId: number
    ): Promise<MealPublic[]> {
      const now = new Date()

      return db
        .selectFrom('meal')
        .select(mealKeysPublic)
        .where('householdId', '=', householdId)
        .where('eatingDate', '>=', now)
        .where('outsideMeal', 'is not', null)
        .execute()
    },
  }
}

export type MealRepo = ReturnType<typeof mealRepo>
