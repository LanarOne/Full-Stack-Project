import { router } from '@server/trpc/index.js'
import create from './create.js'
import getById from './getById.js'
import getByType from './getByType.js'
import getByHouseholdId from './getByHouseholdId.js'
import getExpired from './getExpired.js'
import getSoonExpired from './getSoonExpired.js'
import getByStorage from './getByStorage.js'
import getLowStock from './getLowStock.js'
import update from './update.js'
import remove from './remove.js'

export default router({
  create,
  getById,
  getByType,
  getByHouseholdId,
  getExpired,
  getSoonExpired,
  getByStorage,
  getLowStock,
  update,
  remove,
})
