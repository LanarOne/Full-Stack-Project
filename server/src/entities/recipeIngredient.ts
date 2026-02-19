import { z } from 'zod'
import { idSchema } from '@server/entities/shared'
import type { RcpIngr } from '@server/database'
import type { Selectable } from 'kysely'

export const recipeIngredientSchema = z.object({
  recipeId: idSchema,
  ingredientId: idSchema,
  householdId: idSchema,
  amount: z.number().int().positive().min(1),
  unit: z.enum(['grams', 'unit', 'ml']),
})

export const recipeIngredientPublicKeySchema =
  recipeIngredientSchema.omit({
    ingredientId: true,
  })

export const recipeIngredientKeysAll =
  Object.keys(
    recipeIngredientSchema.shape
  ) as (keyof RcpIngr)[]

export const recipeIngredientKeysPublic =
  Object.keys(
    recipeIngredientPublicKeySchema.shape
  ) as (keyof RcpIngr)[]

export type RecipeIngredientPublic = Pick<
  Selectable<RcpIngr>,
  (typeof recipeIngredientKeysPublic)[number]
>
