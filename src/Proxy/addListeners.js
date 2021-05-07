const mc = require('minecraft-protocol')
const proxy = require('../../../../build/proxy')

function addListeners (remoteClient, that) {
  if (remoteClient.isFirstConnection) {
    remoteClient.on('packet', (data, metadata) => {
      if (remoteClient.localClient.state === mc.states.PLAY && metadata.state === mc.states.PLAY) {
        let dataout = data
        proxy.handlers[`serverbound-${metadata.name}`]?.forEach(handler => {
          if (dataout != null) dataout = handler.handler(client, dataout, metadata)
        })
        if (dataout != null) remoteClient.localClient.write(metadata.name, dataout)
      }
    })
  }

  remoteClient.localClient.on('packet', (data, metadata) => {
    if (remoteClient.state === mc.states.PLAY && metadata.state === mc.states.PLAY) {
      let dataout = data
      proxy.handlers[`clientbound-${metadata.name}`]?.forEach(handler => {
        if (dataout != null) dataout = handler.handler(client, dataout, metadata)
      })
      if (dataout != null) remoteClient.write(metadata.name, dataout)
    }
  })

  remoteClient.localClient.on('kick_disconnect', (data, metadata) => {
    if (that.getFallbackServerName() === remoteClient.currentServer) {
      remoteClient.write(metadata.name, data)
    } else {
      that.fallback(remoteClient.id)
    }
  })
}

module.exports = addListeners
