import { router } from '@server/trpc/index.js'
import create from './create.js'
import getById from './getById.js'
import update from './update.js'

export default router({
  create,
  getById,
  update,
})
