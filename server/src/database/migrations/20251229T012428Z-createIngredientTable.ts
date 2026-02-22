import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>) {
  await db.schema
    .createTable('ingredient')
    .addColumn('id', 'integer', (col) =>
      col.primaryKey().generatedAlwaysAsIdentity()
    )
    .addColumn('name', 'text', (col) =>
      col.notNull()
    )
    .addColumn('type', 'text', (col) =>
      col.notNull()
    )
    .addColumn('quantity', 'integer', (col) =>
      col.notNull().defaultTo(0)
    )
    .addColumn('unit', 'text', (col) =>
      col.notNull()
    )
    .addCheckConstraint(
      'ingredient_unit_check',
      sql`unit in ('grams', 'unit', 'ml')`
    )
    .addColumn(
      'purchase_date',
      'timestamptz',
      (col) => col.notNull()
    )
    .addColumn(
      'expiry_date',
      'timestamptz',
      (col) => col.notNull()
    )
    .addColumn('household_id', 'integer', (col) =>
      col.references('household.id').notNull()
    )
    .addColumn('storage', 'text', (col) =>
      col.notNull()
    )
    .addCheckConstraint(
      'ingredient_storage_check',
      sql`storage in ('fridge', 'freezer', 'dry storage')`
    )
    .addColumn('notif_interval', 'integer')
    .addColumn('next_notif', 'timestamptz')
    .addColumn('is_ready', 'boolean', (col) =>
      col.notNull().defaultTo(true)
    )
    .addColumn('note', 'text')
    .execute()
}

export async function down(db: Kysely<any>) {
  await db.schema
    .alterTable('ingredient')
    .dropConstraint('ingredient_unit_check')
    .execute()

  await db.schema
    .alterTable('ingredient')
    .dropConstraint('ingredient_storage_check')
    .execute()

  await db.schema
    .dropTable('ingredient')
    .execute()
}
