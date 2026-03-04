import { router } from '@server/trpc/index.js'
import create from './create.js'
import getOne from './getOne.js'
import getByMealId from './getByMealId.js'
import getByUserId from './getByUserId.js'
import getUnconfirmed from './getUnconfirmed.js'
import getConfirmedYes from './getConfirmedYes.js'
import getConfirmedNo from './getConfirmedNo.js'
import getAttended from './getAttended.js'
import update from './update.js'
import remove from './remove.js'

export default router({
  create,
  getOne,
  getByMealId,
  getByUserId,
  getUnconfirmed,
  getConfirmedYes,
  getConfirmedNo,
  getAttended,
  update,
  remove,
})
