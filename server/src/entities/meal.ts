import { z } from 'zod'
import { idSchema } from '@server/entities/shared.js'
import type { Meal } from '@server/database/types.js'
import type { Selectable } from 'kysely'

export const mealSchema = z.object({
  id: idSchema,
  portions: z.number().int().positive().min(1),
  recipeId: z.nullable(idSchema),
  outsideMeal: z.nullable(
    z.string().min(3).max(36)
  ),
  eatingDate: z
    .date()
    .min(new Date('2025-12-01')),
  householdId: idSchema,
})

export const mealKeysAll = Object.keys(
  mealSchema.shape
) as (keyof Meal)[]

export const mealPublicSchema = mealSchema.omit({
  id: true,
  householdId: true,
})

export const mealKeysPublic = Object.keys(
  mealPublicSchema.shape
) as (keyof Meal)[]

export type MealPublic = Pick<
  Selectable<Meal>,
  (typeof mealKeysPublic)[number]
>

export const newMealSchema = mealSchema.omit({
  id: true,
})

export const newMealKeysPublic = Object.keys(
  newMealSchema.shape
) as (keyof Meal)[]

export type NewMeal = Pick<
  Selectable<Meal>,
  (typeof newMealKeysPublic)[number]
>
