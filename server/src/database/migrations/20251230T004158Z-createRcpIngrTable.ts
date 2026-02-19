import { type Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>) {
  await db.schema
    .createTable('rcp_ingr')
    .addColumn('recipe_id', 'integer', (col) =>
      col.references('recipe.id').notNull()
    )
    .addColumn(
      'ingredient_id',
      'integer',
      (col) =>
        col.references('ingredient.id').notNull()
    )
    .addColumn('household_id', 'integer', (col) =>
      col.references('household.id').notNull()
    )
    .addColumn('amount', 'integer', (col) =>
      col.notNull()
    )
    .addColumn('unit', 'text', (col) =>
      col.notNull()
    )
    .execute()

  await sql`
ALTER TABLE rcp_ingr
ADD CONSTRAINT rcp_ingr_unit_check
CHECK ( unit IN ('grams', 'unit', 'ml'))
`
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable('rcp_ingr')
}
