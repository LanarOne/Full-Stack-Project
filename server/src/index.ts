import { createDatabase } from './database/index.js'
import config from './config.js'
import createApp from './app.js'

const database = createDatabase(config.database)
const app = createApp(database)

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(
    `Server is running @ http://localhost:${config.port}`
  )
})
