const tracer = require('dd-trace').init(); // eslint-disable-line no-unused-vars
const { randomUUID } = require('node:crypto');
const bunyan = require('bunyan');
const { pino } = require('pino');
const { pinoHttp } = require('pino-http');

// Default to INFO logs and above, unless a valid level name is provided by $LOG_LEVEL.
const logLevel = bunyan.levelFromName[(process.env.LOG_LEVEL || '').toLowerCase()] || bunyan.levelFromName.info;

// By default, log "src" data (filename, line number) if log level is "debug" or lower.
// $LOG_SRC_ENABLED overrides this behavior when set to "true"/"1" or "false"/"0".
let logSrc = logLevel <= bunyan.levelFromName.debug;
if (process.env.LOG_SRC_ENABLED === 'true' || process.env.LOG_SRC_ENABLED === '1') {
    logSrc = true;
} else if (process.env.LOG_SRC_ENABLED === 'false' || process.env.LOG_SRC_ENABLED === '0') {
    logSrc = false;
}

/**
 * Creates a new pino logger with standard configuration defaults
 * @returns pino
 */
function createLogger(options = {}) {
    return pino({
        name: process.env.LOG_NAME || 'gost',
        level: (process.env.LOG_LEVEL || 'info').toLowerCase(),
        formatters: {
            level(level) {
                return { level };
            },
        },
        ...options,
    });
}

function createLoggerMiddleware(logger, appOptions = {}) {
    return pinoHttp({
        logger,
        autoLogging: {
            ignore: (req) => {
                // Don't output auto-logs for health checks
                if (req.originalUrl === '/api/health') {
                    return true;
                }
                // Disable if explicitly requested, such as during tests
                if (appOptions?.disableRequestLogging) {
                    return true;
                }
                return false;
            },
        },
        genReqId: (req) => (req.id ?? req.headers['x-amzn-trace-id'] ?? req.headers['x-request-id'] ?? randomUUID()),
        serializers: {
            req: (req) => {
                const queryStart = req.url.lastIndexOf('?');
                const path = queryStart > -1 ? req.url.substring(0, queryStart) : req.url;
                return { id: req.id, method: req.method, path };
            },
            res: (res) => ({ statusCode: res.statusCode }),
        },
    });
}

module.exports = {
    createLogger,
    createLoggerMiddleware,
    log: createLogger(),
    bunyanLogger: bunyan.createLogger({
        name: process.env.LOG_NAME || 'gost',
        level: logLevel,
        src: logSrc,
        serializers: { err: bunyan.stdSerializers.err },
    }),
};
