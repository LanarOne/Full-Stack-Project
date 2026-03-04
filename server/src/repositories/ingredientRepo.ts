import type {
  Database,
  Ingredient,
} from '@server/database/index.js'
import type {
  Insertable,
  Updateable,
} from 'kysely'
import {
  ingredientKeysAll,
  ingredientKeysPublic,
  type IngredientPublic,
  type Storage,
} from '@server/entities/ingredient.js'

export function ingredientRepo(db: Database) {
  return {
    async create(
      ingredient: Insertable<Ingredient>
    ): Promise<IngredientPublic> {
      return db
        .insertInto('ingredient')
        .values(ingredient)
        .returning(ingredientKeysAll)
        .executeTakeFirstOrThrow()
    },

    async findById(
      id: number,
      householdId: number
    ): Promise<IngredientPublic> {
      return db
        .selectFrom('ingredient')
        .select(ingredientKeysAll)
        .where('id', '=', id)
        .where('householdId', '=', householdId)
        .executeTakeFirstOrThrow()
    },

    async findByType(
      type: string,
      householdId: number
    ): Promise<IngredientPublic[]> {
      return db
        .selectFrom('ingredient')
        .select(ingredientKeysPublic)
        .where('type', '=', type)
        .where('householdId', '=', householdId)
        .execute()
    },

    async findByHouseholdId(
      householdId: number
    ): Promise<IngredientPublic[]> {
      return db
        .selectFrom('ingredient')
        .select(ingredientKeysPublic)
        .where('householdId', '=', householdId)
        .execute()
    },

    async findByPassedExpiryDate(
      expiryDate: Date,
      householdId: number
    ): Promise<IngredientPublic[]> {
      return db
        .selectFrom('ingredient')
        .select(ingredientKeysPublic)
        .where('expiryDate', '<', expiryDate)
        .where('householdId', '=', householdId)
        .execute()
    },

    async findSoonToBeExpired(
      householdId: number
    ): Promise<Promise<IngredientPublic[]>> {
      const now = new Date()
      const expiryDate = new Date()
      expiryDate.setDate(now.getDate() + 3)

      return db
        .selectFrom('ingredient')
        .select(ingredientKeysPublic)
        .where('expiryDate', '>=', now)
        .where('expiryDate', '<=', expiryDate)
        .where('householdId', '=', householdId)
        .execute()
    },

    async findByStorage(
      householdId: number,
      storage: Storage
    ): Promise<IngredientPublic[]> {
      return db
        .selectFrom('ingredient')
        .select(ingredientKeysPublic)
        .where('storage', '=', storage.storage)
        .where('householdId', '=', householdId)
        .execute()
    },

    async findByLowQuantity(
      householdId: number
    ): Promise<IngredientPublic[]> {
      return db
        .selectFrom('ingredient')
        .select(ingredientKeysPublic)
        .where('householdId', '=', householdId)
        .where((eb) =>
          eb.or([
            eb.and([
              eb('unit', '=', 'unit'),
              eb('quantity', '<=', 1),
            ]),
            eb.and([
              eb('unit', '=', 'grams'),
              eb('quantity', '<=', 100),
            ]),
            eb.and([
              eb('unit', '=', 'ml'),
              eb('quantity', '<=', 100),
            ]),
          ])
        )
        .execute()
    },

    async update(
      ingredient: Updateable<Ingredient>,
      householdId: number
    ): Promise<IngredientPublic> {
      const { id, ...fieldsToUpdate } = ingredient

      return db
        .updateTable('ingredient')
        .set(fieldsToUpdate)
        .where('id', '=', Number(id))
        .where('householdId', '=', householdId)
        .returning(ingredientKeysPublic)
        .executeTakeFirstOrThrow()
    },

    async delete(
      id: number,
      householdId: number
    ): Promise<IngredientPublic> {
      return db
        .deleteFrom('ingredient')
        .where('id', '=', id)
        .where('householdId', '=', householdId)
        .returningAll()
        .executeTakeFirstOrThrow()
    },
  }
}

export type IngredientRepo = ReturnType<
  typeof ingredientRepo
>
