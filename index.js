const IRC = require("matrix-org-irc");
const fs = require("fs");
const c = IRC.codes;

const bridges = new Map();

function broadcast(bgn, msg, irc) {
  bridges.get(bgn)
    .forEach(bot => {
      // If it was THIS bot, Then don't.
      if (irc === bot) return;

      bot.chans.forEach(ch => bot.say(ch.key, msg));
    });
}

// ===== Event Handlers =====
function handleKick(chan, ch, nick, by, reason, irc) {
  // If the bot got kicked, Rejoin.
  broadcast(chan.bridge_group_name, `${c.bold}${to} ${nick}${c.reset} ${msg}`, irc);
  if (nick === irc.nick) {
    console.log(`${chan.server} ${irc.nick} - Got kicked by ${by} with reason: ${reason}`);
    setTimeout(_ => irc.join(ch), 5000);
    return;
  }
}

function handleMessage(chan, nick, to, msg, irc) {
  if (to === irc.nick) return; // Ignore PMs.
  broadcast(chan.bridge_group_name, `${c.bold}${to} ${nick}${c.reset} ${msg}`, irc);
}

function handleNotice(chan, nick, to, msg, irc) {
  if (to === irc.nick) return; // Ignore PMs.
  broadcast(chan.bridge_group_name, `${c.bold}${to} Notice(${nick}${c.reset}) ${msg}`, irc);
}

function handleAction(chan, nick, to, msg, irc) {
  if (to === irc.nick) return; // Ignore PMs.
  broadcast(chan.bridge_group_name, `${c.bold}${to} * ${nick}${c.reset} ${msg}`, irc);
}

function handlePart(chan, channel, nick, reason, irc) {
  broadcast(chan.bridge_group_name, `${c.bold}${to} * ${nick}${c.reset} left: ${reason || "No reason provided."}`, irc);
}

function handleJoin(chan, channel, nick, irc) {
  broadcast(chan.bridge_group_name, `${c.bold}${channel} ${nick}${c.reset} joined.`, irc);
}

function handleMotd(chan, irc) {
  console.log(`${chan.server} ${irc.nick} - Ready`);
  broadcast(chan.bridge_group_name, `${chan.server} ${irc.nick} - Ready`, irc);
}

function handleDisconnection(chan, irc) {
  console.log(`${chan.server} ${irc.nick} - Got disconnected from server. Reconnecting in 5 seconds....`);
  broadcast(chan.bridge_group_name, `${chan.server} ${irc.nick} - Got disconnected from server. Reconnecting in 5 seconds....`, irc);

  // Major Problem: irc.connect() does not work when disconnected.
  setTimeout(_ => irc.connect(), 5000);
}

function handleConnect(chan, irc) {
  console.log(`${chan.server} ${irc.nick} - Connected, waiting to be ready....`);
}

// ===== End of event handlers =====

function makebot(filename) {
  const chan = require(__dirname + "/__channels/" + filename);
  const irc = new IRC.Client(chan.server, chan.nick, chan.bot)

  if (!bridges.has(chan.bridge_group_name)) bridges.set(chan.bridge_group_name, new Set());
  bridges.get(chan.bridge_group_name).add(irc);

  irc.on('message', (nick, to, msg) =>
    handleMessage(chan, nick, to, msg, irc)
  );

  irc.on('notice', (nick, to, msg) =>
    handleNotice(chan, nick, to, msg, irc)
  );

  irc.on('action', (nick, to, msg) =>
    handleAction(chan, nick, to, msg, irc)
  );

  irc.on('part', (channel, nick, reason) =>
    handlePart(chan, channel, nick, reason, irc)
  );

  irc.on('join', (channel, nick) =>
    handleJoin(chan, channel, nick, irc)
  );

  irc.on('kick', (ch, nick, by, reason) =>
    handleKick(chan, ch, nick, by, reason, irc)
  );

  irc.on('motd', _ =>
    handleMotd(chan, irc)
  );

  irc.conn.on('close', _ =>
    handleDisconnection(chan, irc)
  );

  irc.conn.on('connect', _ =>
    handleConnect(chan, irc)
  );

  irc.on('error', console.error);

  console.log("-- Loaded", __dirname + "/__channels/" + filename);
  console.log(chan);
}

fs.mkdirSync(__dirname + "/__channels", { recursive: true });
fs.readdir(__dirname + "/__channels", { withFileTypes: true }, (err, dir) => {
  if (err) throw err;
  dir = dir.filter(f => f.isFile || f.isSymbolicLink).map(i => i.name);

  dir.forEach(makebot);
});
