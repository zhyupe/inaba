const path = require('path')
// const helper = require('./helper')
// const logger = helper.getLogger('AuthenticationManager')

class AuthenticationManager {
  constructor (timeout, config) {
    this.timeout = timeout
    this.map = {}
    this.methods = config
    this.methodsForClient = {}

    for (let key of Object.keys(config)) {
      let item = config[key]
      this.methodsForClient[key] = {
        name: item.name || key,
        field: item.field || [],
        description: item.description || null
      }
    }
  }

  getStatus (id) {
    let item = this.map[id]
    if (!item) return null

    if (item.expire < Date.now()) {
      this.map[id] = null
      return null
    }

    return item
  }

  getBackend (id) {
    let item = this.getStatus(id)
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
      let item = this.getStatus(req.id)
      if (!item) {
        item = {
          id: req.id,
          ip: req.ip,
          backends: []
        }
      }

      if (!Array.isArray(backends)) {
        backends = [backends]
      }

      for (let backend of backends) {
        if (!item.backends.includes(backend)) {
          item.backends.push(backend)
        }
      }
      item.expire = Date.now() + this.timeout

      this.map[req.id] = item
      res.end(JSON.stringify(item))
    }).catch(e => {
      res.writeHead(403, 'Forbidden')
      res.end(`Failed: ${e.message}`)
    })
  }

  setBackend (req, res, backend) {
    let item = this.getStatus(req.id)
    if (item && item.backends && item.backends.includes(backend)) {
      item.current = backend
      res.end(JSON.stringify(item))
    } else {
      res.writeHead(403, 'Forbidden')
      res.end('You are not allowed to use this backend')
    }
  }
}

module.exports = AuthenticationManager
