# lust

Node.js command and control tool to intercept, protect, and forward commands from a master to a selected client.

## Setup:

1. Install node.js from https://nodejs.org/
2. Clone or download this repository 
3. Create an account on https://ngrok.com/
4. `$ cd` to the directory that you cloned or downloaded this repository to
5. Run `$ npm i` and wait for node modules to finish installing
6. Edit the `config.json` file and add your ngrok auth-token from https://dashboard.ngrok.com/get-started/your-authtoken to the `authtoken` field 
7. Run `$ (sudo) npm start <flags> <arguments>` and connect to master host and port using telnet or netcat

## Flags / Arguments
```
'h', '--master-host' Master host to bind the listening server to (defaults to: '127.0.0.1')

'p', '--master-port' The port on which the server will be listening for masters (defaults to: 4445)

'H', '--client-host' Clients host to bind the listening server to (defaults to: '0.0.0.0')

'P', '--client-port' The port on which the server will be listening for clients (defaults to: 4444)

'a', '--ngrok-api-key' Your ngrok api key used for port forwarding
```
