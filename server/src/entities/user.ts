import { z } from 'zod'
import { idSchema } from '@server/entities/shared'
import type { User } from '@server/database'
import type {
  Insertable,
  Selectable,
} from 'kysely'

export const userSchema = z.object({
  id: idSchema,
  email: z.string().trim().toLowerCase().email(),
  password: z
    .string()
    .min(
      8,
      'Password must be at least 8 characters'
    )
    .max(
      32,
      'Password must be at most 32 characters'
    ),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(32, 'Name must be at most 32 characters')
    .trim(),
  diet: z.nullable(z.string()),
  allergies: z.nullable(z.string()),
  profilePicture: z.nullable(z.string().url()),
})

export const userKeysAll = Object.keys(
  userSchema.shape
) as (keyof User)[]

export const userKeysPublic = [
  'id',
  'name',
  'diet',
  'allergies',
  'profilePicture',
] as const

export const loginUserKeys = [
  'id',
  'email',
  'password',
] as const

export const createUserSchema = userSchema.omit({
  id: true,
})

export const createUserKeys = Object.keys(
  createUserSchema.shape
) as (keyof User)[]

export type CreateUser = Pick<
  Insertable<User>,
  (typeof createUserKeys)[number]
>

export type UserPublic = Pick<
  Selectable<User>,
  (typeof userKeysPublic)[number]
>

export type LoginUser = Pick<
  Selectable<User>,
  (typeof loginUserKeys)[number]
>

export const authUserSchema = userSchema.pick({
  id: true,
  email: true,
})
export type AuthUser = z.infer<
  typeof authUserSchema
>
