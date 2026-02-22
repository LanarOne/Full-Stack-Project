import { createTestDatabase } from '@server/tests/utils/testDatabase'
import createApp from '@server/app'
import { afterAll } from 'vitest'
import supertest from 'supertest'

const database = createTestDatabase()
const app = createApp(database)

afterAll(() => {
  database.destroy()
})

it('should launch the app', async () => {
  await supertest(app)
    .get('/api/health')
    .expect(200, 'OK')
})
