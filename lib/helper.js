const assert = require('assert')
const ipaddr = require('ipaddr.js')
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

helper.ip2id = (ip) => {
  let ipArray = ip.toByteArray()
  assert.equal(ipArray.length, 16)

  return Buffer.from(ipArray).toString('base64')
}

helper.parseAddr = addr => {
  try {
    let ip = ipaddr.parse(addr)
    if (ip.kind() === 'ipv4') {
      return {
        id: helper.ip2id(ip.toIPv4MappedAddress()),
        ip: ip.toString()
      }
    } else {
      return {
        id: helper.ip2id(ip),
        ip: (ip.isIPv4MappedAddress() ? ip.toIPv4Address() : ip).toString()
      }
    }
  } catch (e) {
    logger.warn(`Failed parsing ${addr}:`, e)
    return { id: 'Invalid', ip: 'Invalid' }
  }
}

const logger = helper.getLogger('helper')
module.exports = helper
