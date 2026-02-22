import { z } from 'zod'
import { idSchema } from '@server/entities/shared'
import type { Household } from '@server/database'
import type { Selectable } from 'kysely'

export const householdSchema = z.object({
  id: idSchema,
  name: z
    .string()
    .min(
      3,
      'Name must be at least 3 characters long'
    )
    .max(
      32,
      'Name must be at most 32 characters long'
    )
    .trim(),
  profilePicture: z.string().url().max(200),
})

export const householdKeysAll = Object.keys(
  householdSchema.shape
) as (keyof Household)[]

export const householdKeysPublic = [
  'id',
  'name',
  'profilePicture',
] as const

export type HouseholdPublic = Pick<
  Selectable<Household>,
  (typeof householdKeysPublic)[number]
>

export const authHouseholdSchema =
  householdSchema.pick({ id: true })

export type AuthHousehold = z.infer<
  typeof authHouseholdSchema
>
