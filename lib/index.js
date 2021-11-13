const colors = require('colors') 
const moment = require('moment')
const { logo, welcomeText } = require('./text')
const NetcatServer = require('netcat/server')
const Interface = require('./server')
const { broadcast } = require('./utilities')

const welcomeMsg = `${logo}\n${welcomeText}`.blue

function start ({ CLIENT_HOST, CLIENT_PORT, MASTER_HOST, MASTER_PORT }) {
  console.log(logo.red, `\nLustC^2 started on port ${MASTER_PORT}, waiting for clients on port ${CLIENT_PORT}`.cyan)

  // client
  const server = new NetcatServer()
  server.k().address(CLIENT_HOST).port(CLIENT_PORT).listen().on('connection', (client) => {
    const now = moment().format('MMM Do YYYY, HH:mm:ss')
    const msg = `[${now}] New client ${client.remoteAddress}:${client.remotePort} (${client.id})`.green + ' connected'.green
    console.log(msg)
    broadcast(masterLoft.getClients(), msg)
  }).on('clientClose', (client) => {
    const now = moment().format('MMM Do YYYY, HH:mm:ss')
    const msg = `[${now}] client ${client.remoteAddress}:${client.remotePort} (${client.id})`.green + ' died'.red
    console.log(msg)
    broadcast(masterLoft.getClients(), msg)
  })

  // master
  const masterLoft = new NetcatServer()
  masterLoft.k().address(MASTER_HOST).port(MASTER_PORT).listen().on('connection', (master) => { // admin socket
    const now = moment().format('MMM Do YYYY, HH:mm:ss')
    console.log(`[${now}] A master has connected to the server`.yellow)
    const cli = new Interface({ welcomeMsg, server, socket: master })
    cli.start()
  }).on('clientClose', (master) => {
    const now = moment().format('MMM Do YYYY, HH:mm:ss')
    console.log(`[${now}] A master`, 'quit'.red)
  })
}

module.exports = {
  start
}
