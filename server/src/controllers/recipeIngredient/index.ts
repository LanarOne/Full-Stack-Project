import { router } from '@server/trpc'
import create from './create'
import getByRecipeId from './getByRecipeId'
import getByIngredientId from './getByIngredientId'
import getByIngredients from './getByIngredients'
import update from './update'
import remove from './remove'

export default router({
  create,
  getByRecipeId,
  getByIngredientId,
  getByIngredients,
  update,
  remove,
})
