const args = require('args')
require('colors')

const { start } = require('./lib/index')

args
    .option(['h', '--master-host'], 'Master host to bind the listening server to', '127.0.0.1')
    .option(['p', '--master-port'], 'The port on which the server will be listening for masters', 4445)
    .option(['H', '--client-host'], 'Clients host to bind the listening server to', '0.0.0.0')
    .option(['P', '--client-port'], 'The port on which the server will be listening for clients', 4444)
    .option(['a', '--ngrok-api-key'], 'Your ngrok api key used for port forwarding')

const flags = args.parse(process.argv)

start({
    MASTER_HOST: flags.masterHost,
    MASTER_PORT: flags.masterPort,
    CLIENT_HOST: flags.clientHost,
    CLIENT_PORT: flags.clientPort,
    NGROK_TOKEN: flags.ngrokApiKey
})