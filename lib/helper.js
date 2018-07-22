const log4js = require('log4js')

let logLevel = 'info'
let helper = {}

log4js.configure({
  appenders: {
    out: { type: 'stdout' },
    server: { type: 'file', filename: 'logs/server.log' }
  },
  categories: { default: { appenders: ['out', 'server'], level: 'error' } }
})

helper.setLogLevel = loglevel => {
  logLevel = loglevel
}

helper.getLogger = name => {
  let logger = log4js.getLogger(name)
  logger.level = logLevel
  return logger
}

module.exports = helper
