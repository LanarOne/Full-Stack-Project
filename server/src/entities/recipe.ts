import { z } from 'zod'
import { idSchema } from '@server/entities/shared'
import type { Recipe } from '@server/database'
import type { Selectable } from 'kysely'

export const recipeSchema = z.object({
  id: idSchema,
  name: z
    .string()
    .min(1, 'Must pass a valid string')
    .max(32)
    .trim()
    .toLowerCase(),
  description: z
    .string()
    .min(1, 'Must pass a valid string')
    .max(100000)
    .toLowerCase(),
  tips: z.nullable(z.string().toLowerCase()),
  portions: z
    .number()
    .int()
    .positive()
    .min(
      1,
      'Meal should be at least one portion'
    ),
  prepTime: z
    .number()
    .int()
    .positive()
    .min(1, 'Prep time should be a few minutes'),
  img: z.nullable(z.string().min(1)),
  vid: z.nullable(z.string().min(1)),
  householdId: idSchema,
  public: z.boolean(),
})

export const recipePublicSchema =
  recipeSchema.omit({ householdId: true })

export const recipeKeysAll = Object.keys(
  recipeSchema.shape
) as (keyof Recipe)[]

export const recipeKeysPublic = Object.keys(
  recipePublicSchema.shape
) as (keyof Recipe)[]

export type RecipePublic = Pick<
  Selectable<Recipe>,
  (typeof recipeKeysPublic)[number]
>

export const newRecipeSchema = recipeSchema.omit({
  id: true,
})

export type NewRecipe = z.infer<
  typeof newRecipeSchema
>

export const recipeFetchKeys = [
  'id',
  'householdId',
] as const

export type FetchRecipe = Pick<
  Selectable<Recipe>,
  (typeof recipeFetchKeys)[number]
>
