import { InSim } from 'node-insim';
import { IS_MST, PacketType, UserType, IS_JRR, JRRAction, ObjectInfo, InSimFlags, IS_MCI, IS_PLL } from 'node-insim/packets';
const inSim = new InSim();
const playerPositions = new Map();
const lastMovementTime = new Map();
const playerNames = new Map();
const INACTIVITY_THRESHOLD = 300000;
const welcomedPlayers = new Set();
const serverRules = [
  'Please be careful in the pits, no ramming, and follow the track route at all times.',
  'Respect other drivers so everyone can enjoy clean racing. Have fun and drive fair.',
  'Everything is allowed: you can rage, swear, trash talk, full freedom of speech.',
  'The only rule: Ramming is forbidden.',
  'Drive however you like, but do not intentionally hit other players.',
  'Anyone ramming will get kicked or banned.'
];

inSim.connect({
  Host: '192.0.0.1',
  Port: 7777,
  IName: 'Node InSim App',
  Admin: '0000',
  Interval: 1000,
  Flags: InSimFlags.ISF_MCI,
  MCI: 1,
});

inSim.on('connect', () => {
  console.log('Connected to LFS InSim');
  sendMessage('InSim Connected');
  console.log('Connection maintained with keep-alive interval');
});

function sendMessage(text) {
  const packet = new IS_MST({
    Msg: text
  });
  inSim.send(packet);
  console.log(`Message sent: "${text}"`);
}

function sendRules(plid) {
  console.log(`Sending server rules to player ${plid}`);
  serverRules.forEach(rule => {
    inSim.sendMessageToPlayer(plid, rule);
  });
}

function sendRulesToAll() {
  console.log('Broadcasting server rules to all players individually');
  const connectedPlayers = Array.from(playerPositions.keys());
  if (connectedPlayers.length > 0) {
    console.log(`Sending rules to ${connectedPlayers.length} connected players`);
    connectedPlayers.forEach(plid => {
      sendRules(plid);
    });
  } else {
    console.log('No connected players found to send rules to');
  }
}

function respawnPlayer(plid) {
  console.log(`Respawning player ${plid} at their current location`);
  const playerPos = playerPositions.get(plid);
  if (playerPos) {
    console.log(`Using player's current position: X=${playerPos.X}, Y=${playerPos.Y}, Z=${playerPos.Z}, Heading=${playerPos.Heading}`);
    const x = Math.round(playerPos.X / 4096);
    const y = Math.round(playerPos.Y / 4096);
    const heading = Math.round(((playerPos.Heading / 32768) * 128 + 128) % 256);
    const packet = new IS_JRR({
      PLID: plid,
      JRRAction: JRRAction.JRR_RESET,
      StartPos: new ObjectInfo({
        X: x,
        Y: y,
        Zbyte: 8,
        Flags: 0x80,
        Index: 0,
        Heading: heading
      })
    });
    inSim.send(packet);
    console.log(`Respawn packet sent for player ${plid} at position X=${x}, Y=${y}, Heading=${heading}`);
  } else {
    console.log(`No position data available for player ${plid}, using default respawn`);
    const packet = new IS_JRR({
      PLID: plid,
      JRRAction: JRRAction.JRR_RESET,
      StartPos: new ObjectInfo({
        X: 0,
        Y: 0,
        Zbyte: 8,
        Flags: 0x80,
        Index: 0,
        Heading: 0
      })
    });
    inSim.send(packet);
    console.log(`Default respawn packet sent for player ${plid}`);
  }
}

function rotatePlayer(plid) {
  console.log(`Rotating player ${plid} 180 degrees from current position`);
  const playerPos = playerPositions.get(plid);

  if (playerPos) {
    console.log(`Using player's current position: X=${playerPos.X}, Y=${playerPos.Y}, Z=${playerPos.Z}, Heading=${playerPos.Heading}`);
    const x = Math.round(playerPos.X / 4096); // 65536 / 16 = 4096
    const y = Math.round(playerPos.Y / 4096);
    const rotatedHeading = (playerPos.Heading + 32768) % 65536;
    const heading = Math.round(((rotatedHeading / 32768) * 128 + 128) % 256);
    const packet = new IS_JRR({
      PLID: plid,
      JRRAction: JRRAction.JRR_RESET,
      StartPos: new ObjectInfo({
        X: x,
        Y: y,
        Zbyte: 8,
        Flags: 0x80,
        Index: 0,
        Heading: heading
      })
    });
    inSim.send(packet);
    console.log(`Rotate packet sent for player ${plid} at position X=${x}, Y=${y}, Heading=${heading} (rotated 180 degrees)`);
  } else {
    console.log(`No position data available for player ${plid}, cannot rotate`);
    const packet = new IS_JRR({
      PLID: plid,
      JRRAction: JRRAction.JRR_RESET,
      StartPos: new ObjectInfo({
        X: 0,
        Y: 0,
        Zbyte: 8,
        Flags: 0x80,
        Index: 0,
        Heading: 0
      })
    });
    inSim.send(packet);
    console.log(`Default respawn packet sent for player ${plid}`);
  }
}

inSim.on('error', (err) => {
  console.error('Error:', err);
});

inSim.on(PacketType.ISP_NPL, (packet) => {
  console.log(`New player joined: ${packet.PName}`);
  playerNames.set(packet.PLID, packet.PName);
  console.log(`Stored player name mapping: PLID ${packet.PLID} -> ${packet.PName}`);
  if (!welcomedPlayers.has(packet.PName)) {
    inSim.sendMessageToPlayer(packet.PLID, `Please be careful in the pits, no ramming, and follow the track route at all times.`);
    inSim.sendMessageToPlayer(packet.PLID, `Respect other drivers so everyone can enjoy clean racing. Have fun and drive fair.`);
    inSim.sendMessageToPlayer(packet.PLID, `Read our !rules and check our !discord`);
    welcomedPlayers.add(packet.PName);
    console.log(`Welcomed ${packet.PName} for the first time.`);
    sendMessage(`Welcome to the server ${packet.PName}`);
    sendMessage(`Please read our !rules and check our !discord`);
  } else {
    console.log(`${packet.PName} has already been welcomed.`);
  }
});

inSim.on(PacketType.ISP_MSO, (packet) => {
  if (packet.UserType === UserType.MSO_USER) {
    const actualMessage = packet.Msg.substring(packet.TextStart).trim().toLowerCase();
    console.log(`Received message: "${packet.Msg}", actual message: "${actualMessage}"`);
    if (actualMessage.startsWith('!')) {
      if (actualMessage === '!rules') {
        console.log(`Player ${packet.UCID} requested rules`);
        sendRules(packet.PLID);
        return;
      }
      else if (actualMessage === '!rulestoall') {
        console.log(`Player ${packet.UCID} requested to broadcast rules to all players`);
        sendRulesToAll();
        return;
      }
      else if (actualMessage === '!rp') {
        console.log(`Player ${packet.UCID} requested to respawn at current location`);
        respawnPlayer(packet.PLID);
        inSim.sendMessageToPlayer(packet.PLID, 'You have respawned at your current location.');
        return;
      }
      else if (actualMessage === '!rt') {
        console.log(`Player ${packet.UCID} requested to rotate 180 degrees`);
        rotatePlayer(packet.PLID);
        inSim.sendMessageToPlayer(packet.PLID, 'You are now facing the opposite direction.');
        return;
      }
      else if (actualMessage === '!discord') {
        console.log(`Player ${packet.UCID} requested Discord invite link`);
        inSim.sendMessageToPlayer(packet.PLID, 'Join our Discord server: https://discord.gg/ByMwW5pqHe');
        return;
      }
      else {
        console.log(`Player ${packet.UCID} entered unknown command: ${actualMessage}`);
        return;
      }
    }
  }
});

inSim.on(PacketType.ISP_MCI, (packet) => {
  packet.Info.forEach(car => {
    const currentTime = Date.now();
    const prevPosition = playerPositions.get(car.PLID);
    playerPositions.set(car.PLID, {
      X: car.X,
      Y: car.Y,
      Z: car.Z,
      Heading: car.Heading
    });

    if (prevPosition &&
        (prevPosition.X !== car.X || 
         prevPosition.Y !== car.Y || 
         prevPosition.Z !== car.Z || 
         prevPosition.Heading !== car.Heading)) {
      lastMovementTime.set(car.PLID, currentTime);
    } else if (!lastMovementTime.has(car.PLID)) {
      lastMovementTime.set(car.PLID, currentTime);
    }
  });
});

function moveToSpectate(plid) {
  const playerName = playerNames.get(plid);
  if (playerName) {
    console.log(`Moving player ${plid} (${playerName}) to spectate due to inactivity`);
    inSim.sendMessageToPlayer(plid, 'You have been moved to spectate mode due to inactivity (5 minutes).');
    inSim.sendMessage(`/spec ${playerName}`);
    lastMovementTime.delete(plid);
    playerPositions.delete(plid);
    playerNames.delete(plid);
  } else {
    console.log(`Cannot move player ${plid} to spectate: player name not found`);
    inSim.sendMessageToPlayer(plid, 'You have been moved to spectate mode due to inactivity (5 minutes).');
    inSim.sendMessage(`/spec ${plid}`);
    lastMovementTime.delete(plid);
    playerPositions.delete(plid);
  }
}

setInterval(() => {
  const currentTime = Date.now();
  lastMovementTime.forEach((lastMoveTime, plid) => {
    const inactiveTime = currentTime - lastMoveTime;
    if (inactiveTime > INACTIVITY_THRESHOLD) {
      console.log(`Player ${plid} has been inactive for ${inactiveTime}ms`);
      moveToSpectate(plid);
    }
  });
}, 5000);

inSim.on(PacketType.ISP_PLL, (packet) => {
  const playerName = playerNames.get(packet.PLID);
  if (playerName) {
    console.log(`Player ${packet.PLID} (${playerName}) left the race`);
    // Remove player from tracking maps
    playerNames.delete(packet.PLID);
    lastMovementTime.delete(packet.PLID);
    playerPositions.delete(packet.PLID);
  } else {
    console.log(`Player ${packet.PLID} left the race (name not found)`);
  }
});

inSim.on(PacketType.ISP_CNL, (packet) => {
  const plidsToRemove = [];
  playerNames.forEach((name, plid) => {
    console.log(`Connection ${packet.UCID} left, but we can't determine which PLID to remove`);
  });
});

inSim.on('disconnect', () => {
  console.log('Disconnected from LFS InSim');
});

process.on('SIGINT', () => {
  console.log('Disconnecting...');
  inSim.disconnect();
  process.exit();
});

console.log('Starting InSim connection...');
