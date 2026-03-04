import type { DB } from '@server/database/types.js'
import {
  type ExpressionOrFactory,
  type Insertable,
  type Kysely,
  sql,
  type SqlBool,
} from 'kysely'

type DatabaseTypes<N extends keyof DB> = {
  [P in N]: DB[P]
}

export const clearTables = async <
  N extends keyof DB,
  T extends DatabaseTypes<N>,
>(
  db: Kysely<T>,
  tableName: N[]
): Promise<void> => {
  const tableNames = sql.join(
    tableName.map(sql.table),
    sql.raw(', ')
  )

  await sql`TRUNCATE TABLE ${tableNames} CASCADE;`.execute(
    db
  )
}

export const insertAll = <
  N extends keyof DB,
  T extends DatabaseTypes<N>,
>(
  db: Kysely<T>,
  tableName: N,
  records: Insertable<DB> | Insertable<DB[N]>[]
) =>
  db
    .insertInto(tableName)
    .values(records as any)
    .returningAll()
    .execute()

export const selectAll = <
  N extends keyof DB,
  T extends DatabaseTypes<N>,
>(
  db: Kysely<T>,
  tableName: N,
  expression?: ExpressionOrFactory<DB, N, SqlBool>
) => {
  const query = db
    .selectFrom(tableName)
    .selectAll()

  return expression
    ? // @ts-ignore
      query.where(expression as any).execute()
    : query.execute()
}
