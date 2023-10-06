const tracer = require('dd-trace').init(); // eslint-disable-line no-unused-vars
const bunyan = require('bunyan');

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

module.exports.log = bunyan.createLogger({
    name: process.env.LOG_NAME || 'gost',
    level: logLevel,
    src: logSrc,
    serializers: { err: bunyan.stdSerializers.err },
});
