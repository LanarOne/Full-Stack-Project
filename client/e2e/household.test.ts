import { fakeHousehold, fakeUser } from './utils/fakes.js'
import { expect, test } from '@playwright/test'
import { asUser } from './utils/api.js'

const user = fakeUser()
const household = fakeHousehold()

test.describe.serial('create a household and navigate to its page', () => {
  test('Logged user can create a household', async ({ page }) => {
    await asUser(page, user, async () => {
      await page.goto('/')

      const navCollapse = page.getByTestId('navCollapse')
      const createBtn = page.getByText('Create household')
      const successMessage = page.getByTestId('successMessage')

      expect(navCollapse).toBeDefined()
      expect(createBtn).toBeDefined()
      await expect(successMessage).toBeHidden()

      await navCollapse.click()
      await createBtn.click()

      await page.waitForURL('/household/create')

      const form = page.getByLabel('New Household')
      await expect(form).toBeVisible()

      await page.getByTestId('householdName').fill(household.name)
      await form.locator('button[type="submit"]').click()
      await expect(successMessage).toBeVisible()
    })
  })

  test('Logged member can access the household url', async ({ page }) => {
    await asUser(page, user, async () => {
      await page.goto('/')

      const navCollapse = page.getByTestId('navCollapse')
      const householdBtn = page.getByText(household.name)

      expect(navCollapse).toBeDefined()
      expect(householdBtn).toBeDefined()

      await navCollapse.click()
      await householdBtn.click()

      const heading = page.getByTestId('householdHeading')
      const failedHeading = page.getByTestId('failedHeading')

      expect(heading).toBeDefined()
      await expect(failedHeading).toBeHidden()
      await expect(page).toHaveURL(/household/i)
      await expect(heading).toHaveText(`${household.name}'s Household !`)
    })
  })

  test('Logged member can create a recipe and see it in the main household page', async ({
    page,
  }) => {
    await asUser(page, user, async () => {
      await page.goto('/')

      const navCollapse = page.getByTestId('navCollapse')
      const householdBtn = page.getByText(household.name)

      expect(navCollapse).toBeDefined()
      expect(householdBtn).toBeDefined()

      await navCollapse.click()
      await householdBtn.click()

      const addRecipeBtn = page.getByText('Add Recipe')

      await addRecipeBtn.click()

      await expect(page).toHaveURL(/create-recipe/i)

      const heading = page.getByText('New Recipe')

      await expect(heading).toBeVisible()

      await page.getByLabel('Name').fill('Some recipes name')
      await page.getByLabel('Description').fill('Some recipes description')
      await page.getByLabel('Tips').fill('Some recipes tips')
      await page.getByLabel('Portions').fill('20')
      await page.getByLabel('Preparation Time').fill('80')
      await page.getByRole('link', { name: 'Create household' }).click()

      await expect(page).toHaveURL(/household/i)

      const newRecipe = page.getByText('Some recipes name')

      expect(newRecipe).toBeDefined()
    })
  })
})
