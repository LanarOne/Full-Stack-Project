import { router } from '@server/trpc'
import create from './create'
import getById from './getById'
import getByType from './getByType'
import getByHouseholdId from './getByHouseholdId'
import getExpired from './getExpired'
import getSoonExpired from './getSoonExpired'
import getByStorage from './getByStorage'
import getLowStock from './getLowStock'
import update from './update'
import remove from './remove'

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
