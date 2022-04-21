const moment = require('moment')
const ngrok = require('ngrok');
const fetch = require('node-fetch')
const NetcatServer = require('netcat/server')
const Interface = require('./server')
const { logo, welcomeText } = require('./text')
const { broadcast } = require('./utilities')
const { authtoken } = require('../config.json')
require('colors')

const welcomeMsg = `${logo}\n${welcomeText}`.blue

async function forward(MASTER_PORT, CLIENT_PORT) {
    console.log(`Forwarding port ${MASTER_PORT} (master) to:`.green)
    await ngrok.connect({
        proto: 'tcp',
        addr: MASTER_PORT,
        authtoken: authtoken,
        region: 'us'
    });
    await fetch('http://localhost:4040/api/tunnels')
        .then(res => res.json())
        .then(json => json.tunnels.map(tunnel => tunnel.public_url))
        .then(publicUrls => console.log(publicUrls[0].blue))
        .catch(err => {
            if (err.code === 'ECONNREFUSED') {
                return console.error(
                    "Looks like you're not running ngrok."
                )
            }
            return console.error(err)
        })
    console.log(`Forwarding port ${CLIENT_PORT} (client) to:`.green)
    await ngrok.connect({
        proto: 'tcp',
        addr: CLIENT_PORT,
        authtoken: authtoken,
        region: 'us'
    });
    await fetch('http://localhost:4040/api/tunnels')
        .then(res => res.json())
        .then(json => json.tunnels.map(tunnel => tunnel.public_url))
        .then(publicUrls => console.log(publicUrls[1].blue))
        .catch(err => {
            if (err.code === 'ECONNREFUSED') {
                return console.error(
                    "Looks like you're not running ngrok."
                )
            }
            return console.error(err)
        })
}



function start({ CLIENT_HOST, CLIENT_PORT, MASTER_HOST, MASTER_PORT, NGROK_TOKEN }) {

    if (!NGROK_TOKEN && !authtoken) {
        throw Error('Please provide a valid ngrok token!')
    }
    console.log(logo.red, `\nLustC^2 started on port ${MASTER_PORT}, waiting for clients on port ${CLIENT_PORT}`.cyan)
    forward(MASTER_PORT, CLIENT_PORT)

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
        const cli = new Interface({
            welcomeMsg,
            server,
            socket: master
        })
        cli.start()
    }).on('clientClose', (master) => {
        const now = moment().format('MMM Do YYYY, HH:mm:ss')
        console.log(`[${now}] A master`, 'quit'.red)
    })
}

module.exports = {
    start
}