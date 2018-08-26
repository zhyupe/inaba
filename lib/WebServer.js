const url = require('url')
const http = require('http')
const fs = require('fs')
const path = require('path')
const proxyAddr = require('proxy-addr')
const helper = require('./helper')
const logger = helper.getLogger('WebServer')

class WebServer {
  constructor (authManager, trustProxy) {
    this.authManager = authManager
    this.trustProxy = trustProxy ? proxyAddr.compile(trustProxy) : null
  }

  handler (req, res) {
    if (req.method !== 'GET') {
      res.writeHead(405, 'Method Not Allowed')
      res.write('Sorry, the auth server allows only GET requests.')
      res.end()
      return
    }

    let reqUrl = url.parse(req.url, true)
    let ip = req.connection.remoteAddress
    if (this.trustProxy !== null) {
      ip = proxyAddr(req, this.trustProxy)
    }
    Object.assign(req, helper.parseAddr(ip))
    logger.info(`[${req.ip}] ${req.method} ${req.url}`)

    if (reqUrl.pathname.startsWith('/api/')) {
      if (reqUrl.pathname.startsWith('/api/auth/')) {
        let method = reqUrl.pathname.substr(10)
        this.authManager.auth(req, res, method, reqUrl.query)
      } else {
        switch (reqUrl.pathname.substr(5)) {
          case 'auth':
            res.end(JSON.stringify(this.authManager.getMethods()))
            break
          case 'status':
            const status = this.authManager.getStatus(req.id) || { ip: req.ip, id: req.id }
            res.end(JSON.stringify(status))
            break
          case 'select':
            this.authManager.setBackend(req, res, reqUrl.query.backend)
            break
          default:
            res.writeHead(400, 'Bad Request')
            res.end('Unknown endpoint')
        }
      }
    } else {
      // static files
      let pathname = url.resolve('/', reqUrl.pathname)
      if (pathname === '/') {
        pathname = 'index.html'
      }

      let realPath = path.join('public', pathname)
      fs.stat(realPath, err => {
        if (err) {
          if (pathname === '/') {
            res.writeHead(404, 'Not Found')
            res.end('ERROR File does not exist')
          } else {
            res.writeHead(302, 'Found', { location: '/' })
            res.end()
          }
        } else {
          fs.createReadStream(realPath).pipe(res)
        }
      })
    }
  }

  listen (port) {
    http.createServer(this.handler.bind(this)).listen(port)
  }
}

module.exports = WebServer
