import { createDatabase } from './database/index.js'
import config from './config.js'
import createApp from './app.js'
import logger from "./logger.js";

try {
    const database = createDatabase(config.database)
    const app = createApp(database)

    const server = app.listen(config.port, () => {
        logger.info({port: config.port}, 'Server listening')
    })

    server.on('error', (err) => {
        logger.fatal({err, port: config.port}, 'Server failed to start')
        process.exit(1)
    })
} catch (err) {
    logger.fatal({err}, 'Application failed during startup')
    process.exit(1)
}

process.on('uncaughtException', (err) => {
    logger.fatal({
        err,
    },'Uncaught exception')
    process.exit(1)
})

process.on('unhandledRejection', (reason) => {
    logger.fatal({
        err: reason,
    },'Unhandled rejection')
    process.exit(1)
})