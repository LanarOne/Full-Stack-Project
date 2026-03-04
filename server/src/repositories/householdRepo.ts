import type {
  Database,
  Household,
} from '@server/database/index.js'
import {
  householdKeysPublic,
  type HouseholdPublic,
} from '@server/entities/household.js'
import type { Insertable } from 'kysely'

export function householdRepo(db: Database) {
  return {
    async create(
      household: Insertable<Household>
    ): Promise<HouseholdPublic> {
      return db
        .insertInto('household')
        .values(household)
        .returning(householdKeysPublic)
        .executeTakeFirstOrThrow()
    },

    async findById(
      id: number
    ): Promise<HouseholdPublic> {
      return db
        .selectFrom('household')
        .select(householdKeysPublic)
        .where('id', '=', id)
        .executeTakeFirstOrThrow()
    },

    async update(
      id: number,
      data: Partial<Household>
    ): Promise<HouseholdPublic> {
      const { name, profilePicture } = data
      return db
        .updateTable('household')
        .set({ name, profilePicture })
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirstOrThrow()
    },

    async delete(
      id: number
    ): Promise<HouseholdPublic> {
      return db
        .deleteFrom('household')
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirstOrThrow()
    },
  }
}

export type HouseholdRepo = ReturnType<
  typeof householdRepo
>
