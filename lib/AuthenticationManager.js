const path = require('path')
// const helper = require('./helper')
// const logger = helper.getLogger('AuthenticationManager')

class AuthenticationManager {
  constructor (config) {
    this.map = {}
    this.methods = config
    this.methodsForClient = {}

    for (let key of Object.keys(config)) {
      this.methodsForClient[key] = config[key].field
    }
  }

  getStatus (ip) {
    let item = this.map[ip]
    if (!item) return null

    if (item.expire < Date.now()) {
      this.map[ip] = null
      return null
    }

    return item
  }

  getBackend (ip) {
    let item = this.getStatus(ip)
    return item ? item.current : null
  }

  getMethods () {
    return this.methodsForClient
  }

  auth (req, res, method, query) {
    let methodObject = this.methods[method]
    if (!methodObject) {
      res.writeHead(404, 'Not Found')
      res.end('Unknown method')
      return
    }

    let methodHandler = null
    try {
      methodHandler = require(`./${path.join('authenticator', methodObject.type)}`)
    } catch (e) {
      try {
        methodHandler = require(`inaba-auth-${methodObject.type}`)
      } catch (e) {}
    }

    if (methodHandler === null) {
      res.writeHead(500, 'Internal Server Error')
      res.end('Failed initializing authenticator')
      return
    }

    methodHandler(methodObject.params, query).then(backends => {
      let item = this.getStatus(req.ip)
      if (!item) {
        item = {
          ip: req.ip,
          backends: []
        }
      }

      item.backends = item.backends.concat(backends)
      item.expire = Date.now() + 600000

      this.map[req.ip] = item
      res.end(JSON.stringify(item))
    }).catch(e => {
      res.writeHead(403, 'Forbidden')
      res.end(`Failed: ${e.message}`)
    })
  }

  setBackend (req, res, backend) {
    let item = this.getStatus(req.ip)
    if (item && item.backends && item.backends.includes(backend)) {
      item.current = backend
      res.end('Succeed')
    } else {
      res.writeHead(403, 'Forbidden')
      res.end('You are not allowed to use this backend')
    }
  }
}

module.exports = AuthenticationManager
