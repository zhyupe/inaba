const net = require('net')
const helper = require('./helper')
const logger = helper.getLogger('ProxyServer')

const STATUS = { closed: 0, ready: 1, piped: 2 }
const setListener = sock => {
  sock.on('error', function () {
    try {
      this.end()
    } catch (e) {}
  })
  sock.on('close', function () {
    if (this.status === STATUS.piped && this.pipedSock.status === STATUS.piped) {
      this.status = STATUS.closed
      this.pipedSock.end()
    } else {
      this.status = STATUS.closed
    }
  })
}

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
    sock.status = STATUS.ready

    logger.debug(`[handler][${sock.id}] Connected.`)
    setListener(sock)

    const backendKey = this.authManager.getBackend(id)
    if (!backendKey) {
      return this.close(sock, 'No backend set for this address')
    }

    const backend = this.backends[backendKey]
    if (!backend) {
      logger.warn(`[handler] Unknown backend ${JSON.stringify(backendKey)}, check your configuration.`)
      return this.close(sock, 'No backend set for this address')
    }

    logger.debug(`[handler][${sock.id}] Connected, backend: ${backend}.`)
    const backendSocket = net.connect(backend.port, backend.host, function () {
      backendSocket.status = STATUS.ready
      if (sock.status === STATUS.ready) {
        backendSocket.pipe(sock)
        sock.pipe(backendSocket)

        backendSocket.pipedSock = sock
        sock.pipedSock = backendSocket
      } else {
        try { backendSocket.end(); sock.end() } catch (e) {}
      }
    })

    setListener(backendSocket)
  }

  listen (port) {
    this.server = net.createServer(this.handler.bind(this)).listen(port, function () {
      logger.info(`Listening at ${port}`)
    })
  }
}

module.exports = ProxyServer
