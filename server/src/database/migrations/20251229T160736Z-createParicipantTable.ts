import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>) {
  await db.schema
    .createTable('participant')
    .addColumn('meal_id', 'integer', (col) =>
      col.references('meal.id').notNull()
    )
    .addColumn('user_id', 'integer', (col) =>
      col.references('user.id').notNull()
    )
    .addColumn('confirmation', 'boolean', (col) =>
      col.defaultTo(null)
    )
    .addColumn('attended', 'boolean', (col) =>
      col.defaultTo(false).notNull()
    )
    .execute()
}

export async function down(db: Kysely<any>) {
  await db.schema
    .dropTable('participant')
    .execute()
}
