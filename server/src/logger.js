import { pino } from "pino";
const logger = pino({
    transport: {
        target: "pino-pretty",
        options: {
            translateTime: "SYS:dd-mm-yyyy HH:MM:SS",
            ignore: "pid,hostname"
        }
    }
});
export default logger;
//# sourceMappingURL=logger.js.map