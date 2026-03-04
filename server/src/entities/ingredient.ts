import { z } from 'zod'
import { idSchema } from '@server/entities/shared.js'
import type { Ingredient } from '@server/database/types.js'
import type { Selectable } from 'kysely'

export const ingredientSchema = z.object({
  id: idSchema,
  name: z
    .string()
    .min(
      3,
      'Ingredient name must be at least 3 characters'
    )
    .max(
      32,
      'Ingredient name must be at most 3 characters'
    )
    .trim()
    .toLowerCase(),
  type: z
    .string()
    .min(
      3,
      'Ingredient type must be at least 3 characters'
    )
    .max(
      32,
      'Ingredient type must be at most 3 characters'
    )
    .trim()
    .toLowerCase(),
  quantity: z.number().int().nonnegative(),
  unit: z.enum(['grams', 'unit', 'ml']),
  purchaseDate: z.coerce
    .date()
    .min(
      new Date('2025-12-01'),
      'It does not sound healthy to eat something this old'
    ),
  expiryDate: z.coerce
    .date()
    .min(
      new Date('2025-01-01'),
      'It does not sound healthy to eat this'
    ),
  householdId: idSchema,
  storage: z.enum([
    'fridge',
    'freezer',
    'dry storage',
  ]),
  notifInterval: z.nullable(
    z.number().int().positive()
  ),
  nextNotif: z.nullable(z.date().min(new Date())),
  isReady: z.boolean(),
  note: z.nullable(z.string()),
})

export const ingredientKeysAll = Object.keys(
  ingredientSchema.shape
) as (keyof Ingredient)[]

export const ingredientKeysPublic = [
  'name',
  'type',
  'quantity',
  'unit',
  'purchaseDate',
  'expiryDate',
  'notifInterval',
  'nextNotif',
  'isReady',
  'note',
  'storage',
] as const

export type IngredientPublic = Pick<
  Selectable<Ingredient>,
  (typeof ingredientKeysPublic)[number]
>
export const newIngredientSchema =
  ingredientSchema.omit({
    id: true,
    expiryDate: true,
  })
const newIngredientKeysPublic = Object.keys(
  newIngredientSchema.shape
) as (keyof Ingredient)[]

export type NewIngredient = Pick<
  Selectable<Ingredient>,
  (typeof newIngredientKeysPublic)[number]
>

const ingredientStorage = ingredientSchema.pick({
  storage: true,
})

export type Storage = z.infer<
  typeof ingredientStorage
>
