import { router } from '@server/trpc'
import create from './create'
import getById from './getById'
import getPublicById from './getPublicById'
import getByName from './getByName'
import getByHouseholdId from './getByHouseholdId'
import getByPrepTime from './getByPrepTime'
import getAllPublic from './getAllPublic'
import getPublicByHouseholdId from './getPublicByHouseholdId'
import update from './update'
import remove from './remove'

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
