module.exports = {
  server: "irc.example.com",
  nick: "BridgeBot",
  bot: {
    port: 6669,
    channels: [ "#channelToBridge", "#couldEvenMoreThanOne" ],
    secure: true,
    // For more information, See https://node-irc.readthedocs.io/en/latest/API.html#client
  },

  bridge_group_name: "groupNameToBroadcast"
}
