import type {
  Database,
  Leftover,
} from '@server/database'
import type {
  Insertable,
  Updateable,
} from 'kysely'
import {
  leftoverKeysAll,
  type LeftoverPublic,
  leftoverPublicKeysAll,
} from '@server/entities/leftover'

export function leftoverRepo(db: Database) {
  return {
    async create(
      leftover: Insertable<Leftover>
    ): Promise<LeftoverPublic> {
      return db
        .insertInto('leftover')
        .values(leftover)
        .returning(leftoverKeysAll)
        .executeTakeFirstOrThrow()
    },

    async findById(
      id: number,
      householdId: number
    ): Promise<LeftoverPublic> {
      return db
        .selectFrom('leftover')
        .select(leftoverPublicKeysAll)
        .where('id', '=', id)
        .where('householdId', '=', householdId)
        .executeTakeFirstOrThrow()
    },

    async findByMealId(
      mealId: number,
      householdId: number
    ): Promise<LeftoverPublic> {
      return db
        .selectFrom('leftover')
        .select(leftoverPublicKeysAll)
        .where('mealId', '=', mealId)
        .where('householdId', '=', householdId)
        .executeTakeFirstOrThrow()
    },

    async findByHouseholdId(
      householdId: number
    ): Promise<LeftoverPublic[]> {
      return db
        .selectFrom('leftover')
        .select(leftoverPublicKeysAll)
        .where('householdId', '=', householdId)
        .execute()
    },

    async update(
      leftover: Updateable<Leftover>
    ): Promise<LeftoverPublic> {
      const { id, portions, householdId } =
        leftover

      return db
        .updateTable('leftover')
        .set({ portions })
        .where('id', '=', Number(id))
        .where(
          'householdId',
          '=',
          Number(householdId)
        )
        .returning(leftoverPublicKeysAll)
        .executeTakeFirstOrThrow()
    },

    async delete(
      id: number,
      householdId: number
    ): Promise<LeftoverPublic> {
      return db
        .deleteFrom('leftover')
        .where('id', '=', id)
        .where('householdId', '=', householdId)
        .returningAll()
        .executeTakeFirstOrThrow()
    },
  }
}

export type LeftoverRepo = ReturnType<
  typeof leftoverRepo
>
