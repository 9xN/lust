const args = require('args')
const ngrok = require('ngrok');
const fetch = require('node-fetch')
const config = require('./config.json')
const authtoken = config.authtoken
require('colors')

const { start } = require('./lib/index')

args
    .option(['h', 'master-host'], 'Master host to bind the listening server to', '127.0.0.1')
    .option(['p', 'master-port'], 'The port on which the server will be listening for masters', 4445)
    .option(['H', 'client-host'], 'Clients host to bind the listening server to', '0.0.0.0')
    .option(['P', 'client-port'], 'The port on which the server will be listening for clients', 4444)

const flags = args.parse(process.argv)

start({
    MASTER_HOST: flags.masterHost,
    MASTER_PORT: flags.masterPort,
    CLIENT_HOST: flags.clientHost,
    CLIENT_PORT: flags.clientPort
})




async function main() {
    for (let port = 4444; port < 4446; port++) {
        console.log(`Forwarding port ${port} to:`.green)
        await ngrok.connect({
            proto: 'tcp',
            addr: port,
            authtoken: authtoken,
            region: 'us'
        });
        await fetch('http://localhost:4040/api/tunnels')
            .then(res => res.json())
            .then(json => json.tunnels.map(tunnel => tunnel.public_url))
            .then(publicUrls => console.log(publicUrls[0].blue)) //, publicUrls.forEach(url => console.log(url)))
            .catch(err => {
                if (err.code === 'ECONNREFUSED') {
                    return console.error(
                        "Looks like you're not running ngrok."
                    )
                }
                return console.error(err)
            })
    }
}

main();