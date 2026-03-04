import { router } from '@server/trpc/index.js'
import signup from './signup.js'
import login from './login.js'
import update from './update.js'

export default router({
  signup,
  login,
  update,
})
