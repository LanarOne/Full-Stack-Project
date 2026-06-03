import { router } from '@server/trpc/index.js'
import signup from './signup.js'
import login from './login.js'
import update from './update.js'
import getById from './getById.js'
import getByGivenId from './getByGivenId.js'
import getByEmail from './getByEmail.js'
import logout from './logout.js'

export default router({
  signup,
  login,
  update,
  getById,
  getByGivenId,
  getByEmail,
  logout,
})
