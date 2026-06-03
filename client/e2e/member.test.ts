import { fakeHousehold, fakeUser } from './utils/fakes.js'
import { expect, test } from '@playwright/test'
import { asUser, createHousehold, createUser, signupNewUser, trpc } from './utils/api.js'

const user = fakeUser()
const guestUser = fakeUser({ name: 'NTM' })
const household = fakeHousehold()

test.describe.serial('Create household and invite another user in', () => {
  test('Creates household and invite a user', async ({ page }) => {
    await createUser(guestUser)

    await asUser(page, user, async () => {
      await createHousehold(page, household.name)
      await expect(page).toHaveURL(/\/household\/\d+$/)

      const householdUrl = page.url()
      const householdId = Number(householdUrl.split('/').pop())

      await page.goto(`/household/${householdId}`)
      await page.getByTestId('addMemberBtn').click()

      await expect(page).toHaveURL(`/household/${householdId}/add-member`)
      await page.getByLabel('Member Email').fill(guestUser.email)
      await page.getByTestId('submitBtn').click()

      await expect(page).toHaveURL(`household/${householdId}`)
      await expect(page.getByText('NTM')).toBeVisible()
    })
  })

  test('Admin user can delete a member from the list by clicking the button', async ({ page }) => {
    await createUser(guestUser)

    await asUser(page, user, async () => {
      await createHousehold(page, household.name)
      await expect(page).toHaveURL(/\/household\/\d+$/)

      const householdUrl = page.url()
      const householdId = Number(householdUrl.split('/').pop())

      await page.goto(`/household/${householdId}`)

      const addMemberBtn = page.getByTestId('addMemberBtn')
      await addMemberBtn.click()

      await expect(page).toHaveURL(`/household/${householdId}/add-member`)
      await page.getByLabel('Member Email').fill(guestUser.email)
      await page.getByTestId('submitBtn').click()

      await expect(page).toHaveURL(`household/${householdId}`)
      await expect(page.getByText('NTM')).toBeVisible()

      const deleteBtn = page.getByText('NTMx')

      await deleteBtn.click()

      const membersList = page.getByTestId('memberslist')
      await expect(membersList).toHaveCount(1)
    })
  })
})
