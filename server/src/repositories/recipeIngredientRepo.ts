import type {
  Database,
  RcpIngr,
} from '@server/database/index.js'
import type {
  Insertable,
  Updateable,
} from 'kysely'
import {
  recipeIngredientKeysAll,
  recipeIngredientKeysPublic,
  type RecipeIngredientPublic,
} from '@server/entities/recipeIngredient.js'

export function recipeIngredientRepo(
  db: Database
) {
  return {
    async create(
      recipeIngredient: Insertable<RcpIngr>
    ): Promise<RecipeIngredientPublic> {
      return db
        .insertInto('rcpIngr')
        .values(recipeIngredient)
        .returning(recipeIngredientKeysAll)
        .executeTakeFirstOrThrow()
    },

    async findByRecipeId(
      recipeId: number,
      householdId: number
    ): Promise<RecipeIngredientPublic[]> {
      return db
        .selectFrom('rcpIngr')
        .select(recipeIngredientKeysPublic)
        .where('recipeId', '=', recipeId)
        .where('householdId', '=', householdId)
        .execute()
    },

    async findByIngredientId(
      ingredientId: number,
      householdId: number
    ): Promise<RecipeIngredientPublic[]> {
      return db
        .selectFrom('rcpIngr')
        .select(recipeIngredientKeysPublic)
        .where('ingredientId', '=', ingredientId)
        .where('householdId', '=', householdId)
        .execute()
    },

    async findByMultipleIngredientIds(
      ingredientIds: number[],
      householdId: number
    ): Promise<{ recipeId: number }[]> {
      return db
        .selectFrom('rcpIngr')
        .select(['recipeId'])
        .where(
          'ingredientId',
          'in',
          ingredientIds
        )
        .where('householdId', '=', householdId)
        .groupBy('recipeId')
        .orderBy('recipeId', 'desc')
        .execute()
    },

    async update(
      recipeIngredient: Updateable<RcpIngr>
    ): Promise<RecipeIngredientPublic> {
      const {
        recipeId,
        ingredientId,
        amount,
        unit,
        householdId,
      } = recipeIngredient

      return db
        .updateTable('rcpIngr')
        .set({ amount, unit })
        .where('recipeId', '=', Number(recipeId))
        .where(
          'ingredientId',
          '=',
          Number(ingredientId)
        )
        .where(
          'householdId',
          '=',
          Number(householdId)
        )
        .returning(recipeIngredientKeysPublic)
        .executeTakeFirstOrThrow()
    },

    async delete(
      recipeId: number,
      ingredientId: number,
      householdId: number
    ): Promise<RecipeIngredientPublic> {
      return db
        .deleteFrom('rcpIngr')
        .where('recipeId', '=', recipeId)
        .where('ingredientId', '=', ingredientId)
        .where('householdId', '=', householdId)
        .returningAll()
        .executeTakeFirstOrThrow()
    },
  }
}

export type RecipeIngredientRepo = ReturnType<
  typeof recipeIngredientRepo
>
