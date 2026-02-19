import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>) {
  await db.schema
    .createTable('member')
    .addColumn('user_id', 'integer', (col) =>
      col.references('user.id').notNull()
    )
    .addColumn('household_id', 'integer', (col) =>
      col.references('household.id')
    )
    .addColumn('role_id', 'integer', (col) =>
      col.references('role.id')
    )
    .execute()
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable('member').execute()
}
