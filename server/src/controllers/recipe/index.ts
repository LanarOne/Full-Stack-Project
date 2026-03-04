import { router } from '@server/trpc/index.js'
import create from './create.js'
import getById from './getById.js'
import getPublicById from './getPublicById.js'
import getByName from './getByName.js'
import getByHouseholdId from './getByHouseholdId.js'
import getByPrepTime from './getByPrepTime.js'
import getAllPublic from './getAllPublic.js'
import getPublicByHouseholdId from './getPublicByHouseholdId.js'
import update from './update.js'
import remove from './remove.js'

export default router({
  create,
  getById,
  getPublicById,
  getByName,
  getByHouseholdId,
  getByPrepTime,
  getAllPublic,
  getPublicByHouseholdId,
  update,
  remove,
})
