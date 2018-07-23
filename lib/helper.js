const ip = require('ip')
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

helper.parseAddr = addr => {
  if (ip.isV4Format(addr)) {
    addr = `::ffff:${addr}`
  }

  return { id: ip.toBuffer(addr).toString('base64'), ip: addr }
}

module.exports = helper
