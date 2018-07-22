const url = require('url')
const http = require('http')
const fs = require('fs')
const path = require('path')
const proxyAddr = require('proxy-addr')

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
    req.ip = req.connection.remoteAddress
    if (this.trustProxy !== null) {
      req.ip = proxyAddr(req, this.trustProxy)
    }

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
            res.end(JSON.stringify(this.authManager.getBackend(req.ip)))
            break
        }
      }
    } else {
      // static files
      let pathname = url.resolve('/', reqUrl.pathname)
      fs.stat(path.join('public', pathname), err => {
        if (err) {
          if (pathname === '/') {
            res.writeHead(404, 'Not Found')
            res.end('ERROR File does not exist')
          } else {
            res.writeHead(302, 'Found', { location: '/' })
            res.end()
          }
        } else {
          fs.createReadStream(pathname).pipe(res)
        }
      })
    }
  }

  listen (port) {
    http.createServer(this.handler.bind(this)).listen(port)
  }
}

module.exports = WebServer
