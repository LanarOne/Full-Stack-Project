import { fakeHousehold, fakeIngredient, fakeUser } from './utils/fakes.js'
import { expect, test } from '@playwright/test'
import { asUser, createHousehold, trpc } from './utils/api.js'

const user = fakeUser()
const household = fakeHousehold()

test.describe.serial('creates an ingredient', () => {
  test('Logged user can create an ingredient in and see it in the households storage', async ({
    page,
  }) => {
    const ingredient = fakeIngredient({ householdId: Number(household.id) })

    await asUser(page, user, async () => {
      await createHousehold(page, household.name)
      await expect(page).toHaveURL(/\/household\/\d+$/)

      const householdUrl = page.url()
      const householdId = Number(householdUrl.split('/').pop())

      const createIngrBtn = page.getByTestId('createIngrBtn')

      await expect(createIngrBtn).toBeVisible()

      await createIngrBtn.click()

      await expect(page).toHaveURL(`household/${householdId}/create-ingredient`)

      const form = page.getByRole('form', { name: 'New Ingredient' })
      const submitBtn = form.locator('button[type="submit"]')

      await expect(submitBtn).toBeVisible()

      await form.locator('input[name="name"]').fill(ingredient.name)
      await form.locator('input[name="type"]').fill(ingredient.type)
      await form.locator('input[name="quantity"]').pressSequentially('5')
      const unit = page.getByLabel('Select a unit')
      await unit.selectOption('ml')
      await form
        .locator('input[name="purchaseDate"]')
        .fill(ingredient.purchaseDate.toISOString().split('T')[0])
      await form
        .locator('input[name="expiryDate"]')
        .fill(ingredient.expiryDate.toISOString().split('T')[0])
      const storage = page.getByLabel('Select a storage')
      await storage.selectOption('dry storage')

      await submitBtn.click()

      await expect(page).toHaveURL(`/household/${householdId}`)

      const storageBtn = page.getByTestId('storageBtn')

      await storageBtn.click()

      await expect(page).toHaveURL(`/household/${householdId}/storage`)

      const ingredientHeading = page.getByText(ingredient.name)

      await expect(ingredientHeading).toBeVisible()
    })
  })
})
