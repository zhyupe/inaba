const net = require('net')
const helper = require('./helper')
const logger = helper.getLogger('ProxyServer')

class ProxyServer {
  constructor (authManager, backends) {
    this.authManager = authManager
    this.backends = backends
  }

  close (sock, reason) {
    logger.info(`[close][${sock.id}] ${reason}.`)
    sock.end(reason)
  }

  handler (sock) {
    let { id, ip } = helper.parseAddr(sock.remoteAddress)
    sock.id = `${ip}:${sock.remotePort}`
    logger.info(`[handler][${sock.id}] Connected.`)

    const backendKey = this.authManager.getBackend(id)
    if (!backendKey) {
      return this.close(sock, 'No backend set for this address')
    }

    const backend = this.backends[backendKey]
    if (!backend) {
      logger.warn(`[handler] Unknown backend ${JSON.stringify(backendKey)}, check your configuration.`)
      return this.close(sock, 'No backend set for this address')
    }

    const backendSocket = net.connect(backend.port, backend.host, function () {
      backendSocket.pipe(sock)
      sock.pipe(backendSocket)
    })
  }

  listen (port) {
    this.server = net.createServer(this.handler.bind(this)).listen(port, function () {
      logger.info(`Listening at ${port}`)
    })
  }
}

module.exports = ProxyServer
