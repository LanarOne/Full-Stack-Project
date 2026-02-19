import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>) {
  await db.schema
    .createTable('user')
    .addColumn('id', 'integer', (col) =>
      col.primaryKey().generatedAlwaysAsIdentity()
    )
    .addColumn('name', 'text', (col) =>
      col.notNull()
    )
    .addColumn('email', 'text', (col) =>
      col.unique().notNull()
    )
    .addColumn('password', 'text', (col) =>
      col.notNull()
    )
    .addColumn('diet', 'text')
    .addColumn('allergies', 'text')
    .addColumn('profilePicture', 'text')
    .execute()
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable('user').execute()
}
