import { sql, type Kysely } from 'kysely'

export async function up(db: Kysely<any>) {
  await db.schema
    .createTable('leftover')
    .addColumn('id', 'integer', (col) =>
      col.primaryKey().generatedAlwaysAsIdentity()
    )
    .addColumn('meal_id', 'integer', (col) =>
      col.references('meal.id').notNull()
    )
    .addColumn('portions', 'integer', (col) =>
      col.notNull()
    )
    .addColumn(
      'expiry_date',
      'timestamptz',
      (col) =>
        col
          .notNull()
          .defaultTo(
            sql`NOW() + INTERVAL '3 days'`
          )
    )
    .addColumn('household_id', 'integer', (col) =>
      col.references('household.id').notNull()
    )
    .execute()
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable('leftover').execute()
}
