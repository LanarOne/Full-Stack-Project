import { router } from '@server/trpc/index.js'
import create from './create.js'
import getById from './getById.js'
import getByRecipeId from './getByRecipeId.js'
import getByHouseholdId from './getByHouseholdId.js'
import getPassedMeals from './getPassedMeals.js'
import getFutureMeals from './getFutureMeals.js'
import getPassedHomemeals from './getPassedHomemeals.js'
import getFutureHomemeals from './getFutureHomemeals.js'
import getPassedOutsideMeals from './getPassedOutsideMeals.js'
import getFutureOutsideMeals from './getFutureOutsideMeals.js'

export default router({
  create,
  getById,
  getByRecipeId,
  getByHouseholdId,
  getPassedMeals,
  getFutureMeals,
  getPassedHomemeals,
  getFutureHomemeals,
  getPassedOutsideMeals,
  getFutureOutsideMeals,
})
