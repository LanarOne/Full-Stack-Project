import type {
  Database,
  Participant,
} from '@server/database'
import type {
  Insertable,
  Updateable,
} from 'kysely'
import {
  participantKeysAll,
  type ParticipantPublic,
} from '@server/entities/participant'

export function participantRepo(db: Database) {
  return {
    async create(
      participant: Insertable<Participant>
    ): Promise<ParticipantPublic> {
      return db
        .insertInto('participant')
        .values(participant)
        .returning(participantKeysAll)
        .executeTakeFirstOrThrow()
    },

    async findOne(
      userId: number,
      mealId: number
    ): Promise<ParticipantPublic> {
      return db
        .selectFrom('participant')
        .select(participantKeysAll)
        .where('userId', '=', userId)
        .where('mealId', '=', mealId)
        .executeTakeFirstOrThrow()
    },

    async findByMealId(
      mealId: number
    ): Promise<ParticipantPublic[]> {
      return db
        .selectFrom('participant')
        .select(participantKeysAll)
        .where('mealId', '=', mealId)
        .execute()
    },

    async findByUserId(
      userId: number
    ): Promise<ParticipantPublic[]> {
      return db
        .selectFrom('participant')
        .select(participantKeysAll)
        .where('userId', '=', userId)
        .execute()
    },

    async findUnconfirmed(
      mealId: number
    ): Promise<ParticipantPublic[]> {
      return db
        .selectFrom('participant')
        .select(participantKeysAll)
        .where('mealId', '=', mealId)
        .where('confirmation', 'is', null)
        .execute()
    },

    async findConfirmedYes(
      mealId: number
    ): Promise<ParticipantPublic[]> {
      return db
        .selectFrom('participant')
        .select(participantKeysAll)
        .where('mealId', '=', mealId)
        .where('confirmation', '=', true)
        .execute()
    },

    async findConfirmedNo(
      mealId: number
    ): Promise<ParticipantPublic[]> {
      return db
        .selectFrom('participant')
        .select(participantKeysAll)
        .where('mealId', '=', mealId)
        .where('confirmation', '=', false)
        .execute()
    },

    async findAttended(
      mealId: number
    ): Promise<ParticipantPublic[]> {
      return db
        .selectFrom('participant')
        .select(participantKeysAll)
        .where('mealId', '=', mealId)
        .where('attended', '=', true)
        .execute()
    },

    async update(
      participant: Updateable<Participant>
    ): Promise<ParticipantPublic> {
      const {
        mealId,
        userId,
        ...fieldsToUpdate
      } = participant

      return db
        .updateTable('participant')
        .set(fieldsToUpdate)
        .where('mealId', '=', Number(mealId))
        .where('userId', '=', Number(userId))
        .returning(participantKeysAll)
        .executeTakeFirstOrThrow()
    },

    async delete({
      userId,
      mealId,
    }: Partial<Participant>): Promise<ParticipantPublic> {
      return db
        .deleteFrom('participant')
        .where('userId', '=', Number(userId))
        .where('mealId', '=', Number(mealId))
        .returningAll()
        .executeTakeFirstOrThrow()
    },
  }
}

export type ParticipantRepo = ReturnType<
  typeof participantRepo
>
