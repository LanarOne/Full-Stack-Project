import { createDatabase } from '@server/database'
import config from '@server/config'
import createApp from '@server/app'

const database = createDatabase(config.database)
const app = createApp(database)

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(
    `Server is running @ http://localhost:${config.port}`
  )
})
