
module.exports = {

  getClientsList: (clientsMap) => {
    const result = Object.keys(clientsMap).map((id) => {
      const { remoteAddress, remotePort } = clientsMap[id]
      return `${id} -> ${remoteAddress}:${remotePort}`
    })
    return result
  },

  getIndexedClientsList: (clientsMap) => {
    const result = Object.keys(clientsMap).map((id, index) => {
      const { remoteAddress, remotePort } = clientsMap[id]
      return `${index}) ${id} -> ${remoteAddress}:${remotePort}`
    })
    return result
  },

  broadcast: (clientsMap, msg) => {
    Object.keys(clientsMap).forEach((clientID) => {
      clientsMap[clientID].write(`${msg}\n`)
    })
  },

  getClientByIndex: (clientsMap, index) => {
    return clientsMap[Object.keys(clientsMap)[index]]
  }

}
