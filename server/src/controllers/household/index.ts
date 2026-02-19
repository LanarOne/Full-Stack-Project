import { router } from '@server/trpc'
import create from './create'
import getById from './getById'
import update from './update'

export default router({
  create,
  getById,
  update,
})
