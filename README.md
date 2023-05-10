## ircbridge
Simple IRC bridge with multiple networks & channels supports

## Setting up
```sh
git clone https://git.sr.ht/~yonle/ircbridge
cd ircbridge
npm i
```

## Configuring networks
See sample configuration files in `__channels` folder.

## Known problem(s)
- Getting disconnected does not wants to reconnect, even `irc.connect()` function was being called.
