# LFS InSim Basic

A Node.js application that connects to a Live for Speed (LFS) racing simulator server using the InSim protocol. This tool provides server administration features, player management, and quality-of-life commands for players.

## Features

- **Player Management**: Tracks players joining and leaving the server
- **Inactivity Monitoring**: Automatically moves inactive players (5+ minutes) to spectate mode
- **Position Tracking**: Monitors player positions in real-time
- **Server Rules**: Displays server rules to new players and on demand
- **Player Commands**:
  - `!rules` - Display server rules
  - `!rulestoall` - Broadcast rules to all players
  - `!rp` - Respawn at current location
  - `!rt` - Rotate 180 degrees
  - `!discord` - Get Discord server invite link
- **Welcome Messages**: Greets new players with welcome messages and rules

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/naitharll/lfs-insim-basic.git
   cd lfs-insim-basic
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Configuration

Edit the connection settings in `server.js` to match your LFS server:

```javascript
inSim.connect({
  Host: '192.0.0.1',  // Change to your LFS server IP
  Port: 777777,             // Change to your LFS server InSim port
  IName: 'Node InSim App', // Change the application name
  Admin: '000000',         // Change to your admin password
  Interval: 1000,
  Flags: InSimFlags.ISF_MCI,
  MCI: 1,
});
```

You can also modify the server rules by editing the `serverRules` array in `server.js`.

## Usage

### Development Mode

Run the server in development mode:

```
npm start
```

or

```
npm run dev
```

### Production Mode

Start the server using PM2 (keeps the process running):

```
npm run prod:start
```

Stop the server:

```
npm run prod:stop
```

## Inactivity Threshold

The default inactivity threshold is set to 5 minutes (300,000 ms). You can modify this by changing the `INACTIVITY_THRESHOLD` constant in `server.js`.

## Dependencies

- [node-insim](https://www.npmjs.com/package/node-insim) (v4.6.2): Library for connecting to LFS using the InSim protocol
- [pm2](https://www.npmjs.com/package/pm2) (v5.3.0): Process manager for Node.js applications

## License

This project is open source. Please include appropriate attribution if you use or modify this code.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.