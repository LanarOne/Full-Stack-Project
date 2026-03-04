import { router } from '@server/trpc/index.js'
import create from './create.js'
import getByRecipeId from './getByRecipeId.js'
import getByIngredientId from './getByIngredientId.js'
import getByIngredients from './getByIngredients.js'
import update from './update.js'
import remove from './remove.js'

export default router({
  create,
  getByRecipeId,
  getByIngredientId,
  getByIngredients,
  update,
  remove,
})
