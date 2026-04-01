import type {
  Database,
  User,
} from '@server/database/index.js'
import type {
  Insertable,
  Updateable,
} from 'kysely'
import {
  type CreateUser,
  userKeysAll,
  userKeysPublic,
  type UserPublic,
} from '@server/entities/user.js'

export function userRepo(db: Database) {
  return {
    async create(
      user: Insertable<User>
    ): Promise<UserPublic> {
      return db
        .insertInto('user')
        .values(user)
        .returning(userKeysPublic)
        .executeTakeFirstOrThrow()
    },
    async findById(
      id: number
    ): Promise<UserPublic> {
      return db
        .selectFrom('user')
        .select(userKeysPublic)
        .where('id', '=', id)
        .executeTakeFirstOrThrow()
    },
    async findByEmail(
      email: string
    ): Promise<CreateUser> {
      return db
        .selectFrom('user')
        .select(userKeysAll)
        .where('email', '=', email)
        .executeTakeFirstOrThrow()
    },

    async update(
      user: Updateable<User>
    ): Promise<UserPublic> {
      const { id, email, ...rest } = user
      if (email !== undefined)
        throw new Error(
          'Email updates are not allowed'
        )
      return db
        .updateTable('user')
        .set(rest)
        .where('id', '=', Number(id))
        .returning(userKeysPublic)
        .executeTakeFirstOrThrow()
    },

    async delete(
      id: number
    ): Promise<UserPublic> {
      return db
        .deleteFrom('user')
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirstOrThrow()
    },
  }
}

export type UserRepo = ReturnType<typeof userRepo>
