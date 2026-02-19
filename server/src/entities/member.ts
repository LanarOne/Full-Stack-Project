import { z } from 'zod'
import { idSchema } from '@server/entities/shared'
import type { Member } from '@server/database'
import type { Selectable } from 'kysely'

export const memberSchema = z.object({
  userId: idSchema,
  householdId: idSchema,
  roleId: idSchema,
})

export const memberKeysAll = Object.keys(
  memberSchema.shape
) as (keyof Member)[]

export type MemberPublic = Pick<
  Selectable<Member>,
  (typeof memberKeysAll)[number]
>
