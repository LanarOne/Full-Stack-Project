import { router } from '../trpc'
import user from './user'
import household from './household'
import member from './member'
import recipe from './recipe'
import recipeIngredient from './recipeIngredient'
import ingredient from './ingredient'
import meal from './meal'
import leftover from './leftover'
import participant from './participant'

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
