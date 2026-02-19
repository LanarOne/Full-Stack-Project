import { router } from '@server/trpc'
import signup from '@server/controllers/user/signup'
import login from '@server/controllers/user/login'
import update from '@server/controllers/user/update'

export default router({
  signup,
  login,
  update,
})
