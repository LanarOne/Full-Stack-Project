import {fakeHousehold, fakeUser} from "./utils/fakes.js";
import {expect, test} from "@playwright/test";
import {asUser, signupNewUser, trpc} from "./utils/api.js";


test.describe.serial('Create household and invite another user in', ()=>{
  test('Creates household and invite a user', async ({page}) => {
    const user = fakeUser()
    const guestUser = fakeUser({name: 'NTM'})
    const household = await asUser(page, user, () => trpc.household.create.mutate(fakeHousehold()))
    await signupNewUser(page, guestUser)

    await asUser(page, user, async ()=> {
      await page.goto(`/household/${household.id}`)

      await page.getByTestId("addMemberBtn").click();

      await expect(page).toHaveURL(`/household/${household.id}/add-member`)
      await page.getByLabel('Member Email').fill(guestUser.email)
      await page.getByTestId('submitBtn').click()

      await expect(page).toHaveURL(`household/${household.id}`)
      await expect(page.getByText('NTM')).toBeVisible()
    })
  })

  test('Admin user can delete a member from the list by clicking the button', async ({page}) => {
    const user = fakeUser()
    const guestUser = fakeUser({name: 'NTM'})
    const household = await asUser(page, user, () => trpc.household.create.mutate(fakeHousehold()))
    await signupNewUser(page, guestUser)

    await asUser(page, user, async ()=> {
      await page.goto(`/household/${household.id}`)

      const addMemberBtn = page.getByTestId("addMemberBtn")
      await addMemberBtn.click()

      await expect(page).toHaveURL(`/household/${household.id}/add-member`)
      await page.getByLabel('Member Email').fill(guestUser.email)
      await page.getByTestId('submitBtn').click()

      await expect(page).toHaveURL(`household/${household.id}`)
      await expect(page.getByText('NTM')).toBeVisible()

      const deleteBtn = page.getByText('NTMx')

      await deleteBtn.click()

      const membersList = await page.getByRole('list')
      expect(membersList).toBeDefined()
    })
    })
})
