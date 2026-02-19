import type { Database } from '@server/database'
import { householdRepo } from '@server/repositories/householdRepo'
import { ingredientRepo } from '@server/repositories/ingredientRepo'
import { leftoverRepo } from '@server/repositories/leftoverRepo'
import { mealRepo } from '@server/repositories/mealRepo'
import { memberRepo } from '@server/repositories/memberRepo'
import { participantRepo } from '@server/repositories/participantRepo'
import { recipeIngredientRepo } from '@server/repositories/recipeIngredientRepo'
import { recipeRepo } from '@server/repositories/recipeRepo'
import { userRepo } from '@server/repositories/userRepo'

export type RepositoryFactory = <T>(
  db: Database
) => T

const repositories = {
  householdRepo,
  ingredientRepo,
  leftoverRepo,
  mealRepo,
  memberRepo,
  participantRepo,
  recipeIngredientRepo,
  recipeRepo,
  userRepo,
}

export type RepositoriesFactories =
  typeof repositories

export type Repositories = {
  [K in keyof RepositoriesFactories]: ReturnType<
    RepositoriesFactories[K]
  >
}

export type RepositoriesKeys = keyof Repositories

export { repositories }
