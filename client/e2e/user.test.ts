import { fakeUser } from './utils/fakes.js'
import { expect, test } from '@playwright/test'
import { asUser } from './utils/api.js'

const user = fakeUser()

test.describe.serial('signup and login sequence', () => {
  test('Visitor can sign up', async ({ page }) => {
    await page.goto('/signup')
    const successMessage = page.getByTestId('successMessage')
    const errorMessage = page.getByTestId('errorMessage')

    await expect(successMessage).toBeHidden()
    await expect(errorMessage).toBeHidden()

    const form = page.getByRole('form', { name: 'Signup' })
    const submitBtn = page.getByTestId('submitBtn')

    await form.locator('input[type="email"]').fill(user.email)
    await form.locator('input[type="password"]').fill(user.password)
    await form.locator('input[data-testid="name"]').fill(user.name)
    await form.locator('input[data-testid="diet"]').fill(user.diet)
    await form.locator('input[data-testid="allergies"]').fill(user.allergies)
    await submitBtn.click()

    await expect(page).toHaveURL('/login')
  })

  test('Visitor is redirected to login if they try to access the main page before login', async ({
    page,
  }) => {
    await page.goto('/')

    await page.waitForURL('/login')
    await expect(page.locator('h2')).toHaveText('Log In')
  })

  test('Visitor is redirected to login if they try to access the household page before login', async ({
    page,
  }) => {
    await page.goto('/household/')

    await page.waitForURL('/login')
    await expect(page.locator('h2')).toHaveText('Log In')
  })

  test('visitor can log in', async ({ page }) => {
    await page.goto('/login')

    const successMessage = page.getByTestId('successMessage')
    await expect(successMessage).toBeHidden()

    const form = page.getByRole('form', { name: 'Login' })
    await form.locator('input[type="email"]').fill(user.email)
    await form.locator('input[type="password"]').fill(user.password)
    await form.locator('button[type="submit"]').click()

    await expect(page).toHaveURL('/')
  })
})

test.describe.serial('logout sequence', () => {
  test('Visitor can log out', async ({ page }) => {
    const user = fakeUser()

    await asUser(page, user, async () => {
      await page.goto('/')
      const logoutLink = page.getByRole('link', { name: 'Logout' })

      await expect(logoutLink).toBeVisible()
      await logoutLink.click()

      await expect(logoutLink).toBeHidden()

      await expect(page).toHaveURL('/login')

      await page.goto('/')
      await expect(logoutLink).toBeHidden()
      await expect(page).toHaveURL('/login')
    })
  })
})
