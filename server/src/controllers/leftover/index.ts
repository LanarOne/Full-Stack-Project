import { router } from '@server/trpc/index.js'
import create from './create.js'
import getById from './getById.js'
import getByMealId from './getByMealId.js'
import getByHouseholdId from './getByHouseholdId.js'
import update from './update.js'
import remove from './remove.js'

export default router({
  create,
  getById,
  getByMealId,
  getByHouseholdId,
  update,
  remove,
})
