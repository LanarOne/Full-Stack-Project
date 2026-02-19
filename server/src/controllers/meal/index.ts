import { router } from '@server/trpc'
import create from './create'
import getById from './getById'
import getByRecipeId from './getByRecipeId'
import getByHouseholdId from './getByHouseholdId'
import getPassedMeals from './getPassedMeals'
import getFutureMeals from './getFutureMeals'
import getPassedHomemeals from './getPassedHomemeals'
import getFutureHomemeals from './getFutureHomemeals'
import getPassedOutsideMeals from './getPassedOutsideMeals'
import getFutureOutsideMeals from './getFutureOutsideMeals'

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
