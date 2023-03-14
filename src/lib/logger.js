const path = require('path')
const stackTrace = require('stack-trace')
const winston = require('winston')
const { combine, timestamp, printf, colorize } = winston.format
const config = require('./config')


/**
 * Transforms the log level from lowercase to upper.
 * Can be used in combination with other Winston transforms.
 */
const upperCaseLevel = winston.format(info => {
  info.level = info.level.toUpperCase()
  return info
})

const customFormat = printf(({ level, message, timestamp, ...meta }) => {
  let event = `${timestamp} [${level}]`

  if (meta && meta.caller) {
    event += ` ${meta.caller.file}:${meta.caller.line}:${meta.caller.col}`
  }

  event += ` -> ${message}`

  return event
})

// Custom Log levels
const customLogLevels = {}
Object.assign(customLogLevels, winston.config.syslog)
customLogLevels.levels.trace = 8
customLogLevels.colors.debug = 'cyan'
customLogLevels.colors.trace = 'magenta'
Object.freeze(customLogLevels.colors)
Object.freeze(customLogLevels.levels)
Object.freeze(customLogLevels)

const logger = winston.createLogger({
  exitOnError: false,
  level: config.logging.level,
  levels: customLogLevels.levels,
  transports: [
    new winston.transports.Console({
      format: combine(
        upperCaseLevel(),
        colorize(),
        timestamp(),
        customFormat
      )
    })
  ]
})

winston.addColors(customLogLevels.colors)

/**
 * This is the internal logging function that interacts directly with Winston.
 * It should *never* be called directly by application code (and is why it is not)
 * exported from this module.
 * @param {string} level A syslog-compatible log level.
 * @param {string} msg Your log message. Use a summary and add details to meta object.
 * @param {object} meta Additional context surrounding the log entrypoint.
 */
function log(level, msg, meta = {}) {
  if (logger[level] === undefined) {
    return
  }

  if (meta === undefined) {
    return
  }

  try {
    let skip = 2

    // We slice an additional frame off if called from @hpoc/log
    // so that we can see the call-site the @hpoc/log functions were
    // called from.
    if (meta && meta.legacy) {
      skip++
    }

    const stack = stackTrace.get()
      .map(site => {
        return {
          file: site.getFileName(),
          line: site.getLineNumber(),
          col: site.getColumnNumber()
        }
      })
      .slice(skip)

    logger.log({
      level: level,
      message: msg,
      stack,
      caller: stack[0],
      ...meta
    })
  } catch (error) {
    console.error(`An error was encountered inside the logger with the following message: ${error.message}`)
  }
}

module.exports = {
  emerg(msg, meta = {}) { log('emerg', msg, meta) },
  alert(msg, meta = {}) { log('alert', msg, meta) },
  critical(msg, meta = {}) { log('crit', msg, meta) },
  crit(msg, meta = {}) { log('crit', msg, meta) },
  error(msg, meta = {}) { log('error', msg, meta) },
  err(msg, meta = {}) { log('error', msg, meta) },
  warning(msg, meta = {}) { log('warning', msg, meta) },
  warn(msg, meta = {}) { log('warning', msg, meta) },
  notice(msg, meta = {}) { log('notice', msg, meta) },
  info(msg, meta = {}) { log('info', msg, meta) },
  debug(msg, meta = {}) { log('debug', msg, meta) },
  trace(msg, meta = {}) { log('trace', msg, meta) }
}
