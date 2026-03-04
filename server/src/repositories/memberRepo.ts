import type {
  Database,
  Member,
} from '@server/database/index.js'
import type { Insertable } from 'kysely'
import {
  memberKeysAll,
  type MemberPublic,
} from '@server/entities/member.js'

export function memberRepo(db: Database) {
  return {
    async create(
      member: Insertable<Member>
    ): Promise<MemberPublic> {
      return db
        .insertInto('member')
        .values(member)
        .returning(memberKeysAll)
        .executeTakeFirstOrThrow()
    },

    async findOne({
      userId,
      householdId,
    }: {
      userId: number
      householdId: number
    }): Promise<MemberPublic> {
      return db
        .selectFrom('member')
        .select(memberKeysAll)
        .where('householdId', '=', householdId)
        .where('userId', '=', userId)
        .executeTakeFirstOrThrow()
    },

    async findByHouseholdId(
      householdId: number
    ): Promise<MemberPublic[]> {
      return db
        .selectFrom('member')
        .select(memberKeysAll)
        .where('householdId', '=', householdId)
        .execute()
    },

    async findByUserId(
      userId: number
    ): Promise<MemberPublic[]> {
      return db
        .selectFrom('member')
        .select(memberKeysAll)
        .where('userId', '=', userId)
        .execute()
    },

    async update(
      member: MemberPublic
    ): Promise<MemberPublic> {
      const { householdId, userId, roleId } =
        member
      return db
        .updateTable('member')
        .set({ roleId })
        .where('householdId', '=', householdId)
        .where('userId', '=', userId)
        .returning(memberKeysAll)
        .executeTakeFirstOrThrow()
    },

    async delete(
      userId: number,
      householdId: number
    ): Promise<MemberPublic> {
      return db
        .deleteFrom('member')
        .where('userId', '=', userId)
        .where('householdId', '=', householdId)
        .returningAll()
        .executeTakeFirstOrThrow()
    },
  }
}

export type MemberRepo = ReturnType<
  typeof memberRepo
>
