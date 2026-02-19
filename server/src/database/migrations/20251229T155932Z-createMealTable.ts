import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>) {
  await db.schema
    .createTable('meal')
    .addColumn('id', 'integer', (col) =>
      col.primaryKey().generatedAlwaysAsIdentity()
    )
    .addColumn('recipe_id', 'integer', (col) =>
      col.references('recipe.id')
    )
    .addColumn('portions', 'integer', (col) =>
      col.notNull()
    )
    .addColumn('outside_meal', 'text')
    .addColumn(
      'eating_date',
      'timestamptz',
      (col) => col.notNull()
    )
    .addColumn('household_id', 'integer', (col) =>
      col.references('household.id').notNull()
    )
    .execute()
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable('meal').execute()
}
