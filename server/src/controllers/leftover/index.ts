import { router } from '@server/trpc'
import create from './create'
import getById from './getById'
import getByMealId from './getByMealId'
import getByHouseholdId from './getByHouseholdId'
import update from './update'
import remove from './remove'

export default router({
  create,
  getById,
  getByMealId,
  getByHouseholdId,
  update,
  remove,
})
