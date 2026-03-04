import { router } from '../trpc/index.js'
import user from './user/index.js'
import household from './household/index.js'
import member from './member/index.js'
import recipe from './recipe/index.js'
import recipeIngredient from './recipeIngredient/index.js'
import ingredient from './ingredient/index.js'
import meal from './meal/index.js'
import leftover from './leftover/index.js'
import participant from './participant/index.js'

export const appRouter = router({
  household,
  ingredient,
  leftover,
  meal,
  member,
  participant,
  recipe,
  recipeIngredient,
  user,
})

export type AppRouter = typeof appRouter
