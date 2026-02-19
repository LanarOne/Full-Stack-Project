import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>) {
  await db.schema
    .createTable('household')
    .addColumn('id', 'integer', (col) =>
      col.primaryKey().generatedAlwaysAsIdentity()
    )
    .addColumn('name', 'text', (col) =>
      col.notNull()
    )
    .addColumn('profilePicture', 'text')
    .execute()
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable('household').execute()
}
