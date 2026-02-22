import type {
  Database,
  Recipe,
} from '@server/database'
import type {
  Insertable,
  Updateable,
} from 'kysely'
import {
  type FetchRecipe,
  recipeKeysAll,
  recipeKeysPublic,
  type RecipePublic,
} from '@server/entities/recipe'

export function recipeRepo(db: Database) {
  return {
    async create(
      recipe: Insertable<Recipe>
    ): Promise<RecipePublic> {
      return db
        .insertInto('recipe')
        .values(recipe)
        .returning(recipeKeysAll)
        .executeTakeFirstOrThrow()
    },

    async findById(
      fetchRecipe: FetchRecipe
    ): Promise<RecipePublic> {
      const { id, householdId } = fetchRecipe
      return db
        .selectFrom('recipe')
        .select(recipeKeysPublic)
        .where('id', '=', id)
        .where('householdId', '=', householdId)
        .executeTakeFirstOrThrow()
    },

    async findByName(
      name: string,
      householdId: number
    ): Promise<RecipePublic[]> {
      return db
        .selectFrom('recipe')
        .select(recipeKeysPublic)
        .where(
          'name',
          'ilike',
          `%${name.toLowerCase()}%`
        )
        .where('householdId', '=', householdId)
        .execute()
    },

    async findByHouseholdId(
      householdId: number
    ): Promise<RecipePublic[]> {
      return db
        .selectFrom('recipe')
        .select(recipeKeysPublic)
        .where('householdId', '=', householdId)
        .execute()
    },

    async findByPrepTime(
      prepTime: number,
      householdId: number
    ): Promise<RecipePublic[]> {
      return db
        .selectFrom('recipe')
        .select(recipeKeysPublic)
        .where('prepTime', '<=', prepTime)
        .where('householdId', '=', householdId)
        .execute()
    },

    async findAllPublicRecipe(): Promise<
      RecipePublic[]
    > {
      return db
        .selectFrom('recipe')
        .select(recipeKeysPublic)
        .where('public', 'is', true)
        .limit(20)
        .execute()
    },

    async findAllPublicRecipeByHousehold(
      householdId: number
    ): Promise<RecipePublic[]> {
      return db
        .selectFrom('recipe')
        .select(recipeKeysPublic)
        .where('householdId', '=', householdId)
        .where('public', 'is', true)
        .limit(20)
        .execute()
    },

    async update(
      recipe: Updateable<Recipe>,
      householdId: number
    ): Promise<RecipePublic> {
      const { id, ...fieldsToUpdate } = recipe

      return db
        .updateTable('recipe')
        .set(fieldsToUpdate)
        .where('id', '=', Number(id))
        .where('householdId', '=', householdId)
        .returning(recipeKeysPublic)
        .executeTakeFirstOrThrow()
    },

    async delete(
      deleteRecipe: FetchRecipe
    ): Promise<RecipePublic> {
      const { id, householdId } = deleteRecipe

      return db
        .deleteFrom('recipe')
        .where('id', '=', id)
        .where('householdId', '=', householdId)
        .returningAll()
        .executeTakeFirstOrThrow()
    },
  }
}

export type RecipeRepo = ReturnType<
  typeof recipeRepo
>
