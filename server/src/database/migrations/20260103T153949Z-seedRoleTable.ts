import { type Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>) {
  await db
    .insertInto('role')
    .values([
      { name: 'founder' },
      { name: 'member' },
      { name: 'guest' },
    ])
    .execute()

  await sql`
        CREATE OR REPLACE FUNCTION prevent_role_changes()
        RETURNS trigger AS $$
        BEGIN
            RAISE EXCEPTION 'role table is immutable';
        END;
        $$ LANGUAGE plpgsql`.execute(db)

  await sql`CREATE TRIGGER role_no_insert
        BEFORE INSERT ON role
        FOR EACH ROW EXECUTE FUNCTION prevent_role_changes()`.execute(
    db
  )

  await sql`CREATE TRIGGER role_no_update
        BEFORE UPDATE ON role
        FOR EACH ROW EXECUTE FUNCTION prevent_role_changes()`.execute(
    db
  )

  await sql`CREATE TRIGGER role_no_delete
        BEFORE DELETE ON role
        FOR EACH ROW EXECUTE FUNCTION prevent_role_changes()`.execute(
    db
  )
}

export async function down(db: Kysely<any>) {
  await sql`
        DROP TRIGGER IF EXISTS role_no_insert ON role`.execute(
    db
  )

  await sql`
        DROP TRIGGER IF EXISTS role_no_delete ON role`.execute(
    db
  )

  await sql`
        DROP TRIGGER IF EXISTS role_no_update ON role`.execute(
    db
  )

  await sql`
        DROP FUNCTION IF EXISTS prevent_role_changes`.execute(
    db
  )

  await db.schema.dropTable('role').execute()
}
