import { router } from '@server/trpc/index.js'
import create from './create.js'
import getOne from './getOne.js'
import getByHouseholdId from './getByHouseholdId.js'
import getByUserId from './getByUserId.js'
import changeHouseholdRole from './changeHouseholdRole.js'
import remove from './remove.js'

export default router({
  create,
  getOne,
  getByHouseholdId,
  getByUserId,
  changeHouseholdRole,
  remove,
})
