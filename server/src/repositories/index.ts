import type { Database } from '@server/database/index.js'
import { householdRepo } from '@server/repositories/householdRepo.js'
import { ingredientRepo } from '@server/repositories/ingredientRepo.js'
import { leftoverRepo } from '@server/repositories/leftoverRepo.js'
import { mealRepo } from '@server/repositories/mealRepo.js'
import { memberRepo } from '@server/repositories/memberRepo.js'
import { participantRepo } from '@server/repositories/participantRepo.js'
import { recipeIngredientRepo } from '@server/repositories/recipeIngredientRepo.js'
import { recipeRepo } from '@server/repositories/recipeRepo.js'
import { userRepo } from '@server/repositories/userRepo.js'

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
