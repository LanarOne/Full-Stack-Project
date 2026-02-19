import { router } from '@server/trpc'
import create from './create'
import getOne from './getOne'
import getByHouseholdId from './getByHouseholdId'
import getByUserId from './getByUserId'
import changeHouseholdRole from './changeHouseholdRole'
import remove from './remove'

export default router({
  create,
  getOne,
  getByHouseholdId,
  getByUserId,
  changeHouseholdRole,
  remove,
})
