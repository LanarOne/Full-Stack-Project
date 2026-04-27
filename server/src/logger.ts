import pino, {type Logger} from "pino";
import 'dotenv/config.js'

const isProd = process.env.NODE_ENV === 'production'
const logger: Logger = pino({
    name: 'PinoLogger',
    level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
    redact: {
        paths: [
            'req.headers.authorization',
            '[*].password',
            'password',
            'token',
            '[*].token',
            'accessToken',
            'refreshToken',
        ],
        censor: '[Redacted]'
    },
    transport: isProd? undefined : {
        target: "pino-pretty",
        options: {
            translateTime: "SYS:dd-mm-yyyy HH:MM:ss",
            ignore: "pid,hostname"
        }
    }
})

export default logger