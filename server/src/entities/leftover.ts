import { z } from 'zod'
import { idSchema } from '@server/entities/shared'
import type { Leftover } from '@server/database'
import type { Selectable } from 'kysely'

export const leftoverSchema = z.object({
  id: idSchema,
  mealId: idSchema,
  portions: z.number().int().nonnegative(),
  expiryDate: z.date(),
  householdId: idSchema,
})

export const leftoverPublicSchema =
  leftoverSchema.omit({ id: true })

export const leftoverKeysAll = Object.keys(
  leftoverSchema.shape
) as (keyof Leftover)[]

export const leftoverPublicKeysAll = Object.keys(
  leftoverPublicSchema.shape
) as (keyof Leftover)[]

export type LeftoverPublic = Pick<
  Selectable<Leftover>,
  (typeof leftoverPublicKeysAll)[number]
>
