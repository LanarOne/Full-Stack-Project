import { router } from '@server/trpc'
import create from './create'
import getOne from './getOne'
import getByMealId from './getByMealId'
import getByUserId from './getByUserId'
import getUnconfirmed from './getUnconfirmed'
import getConfirmedYes from './getConfirmedYes'
import getConfirmedNo from './getConfirmedNo'
import getAttended from './getAttended'
import update from './update'
import remove from './remove'

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
