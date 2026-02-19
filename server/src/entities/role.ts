import { z } from 'zod'
import { idSchema } from '@server/entities/shared'
import type { Role } from '@server/database'
import type { Selectable } from 'kysely'

const roles = [
  'chief',
  'member',
  'guest',
] as const

export const roleSchema = z.object({
  id: idSchema,
  name: z.enum(roles),
})

export const roleKeysAll = Object.keys(
  roleSchema.shape
) as (keyof Role)[]

export type RolePublic = Pick<
  Selectable<Role>,
  (typeof roleKeysAll)[number]
>
