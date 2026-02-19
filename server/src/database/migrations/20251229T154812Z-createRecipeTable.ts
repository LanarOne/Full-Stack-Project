import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>) {
  await db.schema
    .createTable('recipe')
    .addColumn('id', 'integer', (col) =>
      col.primaryKey().generatedAlwaysAsIdentity()
    )
    .addColumn('name', 'text', (col) =>
      col.notNull()
    )
    .addColumn('description', 'text', (col) =>
      col.notNull()
    )
    .addColumn('tips', 'text')
    .addColumn('portions', 'integer', (col) =>
      col.notNull()
    )
    .addColumn('prep_time', 'integer', (col) =>
      col.notNull()
    )
    .addColumn('img', 'text')
    .addColumn('vid', 'text')
    .addColumn('household_id', 'integer', (col) =>
      col.references('household.id').notNull()
    )
    .addColumn('public', 'boolean', (col) =>
      col.notNull().defaultTo(false)
    )
    .execute()
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable('recipe').execute()
}
