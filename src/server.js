import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { createCar } from './car.js';
import { tick } from './raceEngine.js';
import { TRACK_LENGTH, TICK_MS, BOOST_TICKS } from './constants.js';

const PORT = process.env.PORT || 3000;

const app = express();
app.get('/', (_req, res) => res.send('Car Race server is running. Connect a client via Socket.IO.'));
const httpServer = createServer(app);
const io = new Server(httpServer);

const rooms = new Map();
const socketRoom = new Map();

function getOrCreateRoom(roomId) {
  let room = rooms.get(roomId);
  if (!room) {
    room = { id: roomId, players: new Map(), running: false, tickCount: 0, timer: null };
    rooms.set(roomId, room);
  }
  return room;
}

function findOpenRoomId() {
  for (const room of rooms.values()) if (!room.running) return room.id;
  return `room-${rooms.size + 1}`;
}

const carsOf = (room) => [...room.players.values()];

function broadcastLobby(room) {
  io.to(room.id).emit('lobby', {
    room: room.id,
    players: carsOf(room).map((c) => c.name),
    running: room.running,
  });
}

function teardownRoom(room) {
  clearInterval(room.timer);
  rooms.delete(room.id);
}

function resetRace(room) {
  clearInterval(room.timer);
  room.timer = null;
  room.running = false;
  room.tickCount = 0;
  for (const car of room.players.values()) {
    car.position = 0;
    car.speed = 0;
    car.finished = false;
    car.finishTick = null;
    car.boostTicks = 0;
  }
}

async function startRace(room) {
  if (room.running) return;
  if (room.players.size === 0) {
    io.to(room.id).emit('message', 'Cannot start: no players in this room.');
    return;
  }
  resetRace(room);
  room.running = true;

  for (const n of ['3', '2', '1', 'Go!']) {
    io.to(room.id).emit('countdown', n);
    await new Promise((r) => setTimeout(r, n === 'Go!' ? 400 : 700));
  }
  if (!rooms.has(room.id) || room.players.size === 0) return;

  room.timer = setInterval(() => {
    room.tickCount += 1;
    const cars = carsOf(room);
    const { raceOver, winner } = tick(cars, TRACK_LENGTH, room.tickCount);
    io.to(room.id).emit('tick', { cars, tickCount: room.tickCount, trackLength: TRACK_LENGTH });
    if (raceOver) {
      clearInterval(room.timer);
      room.timer = null;
      room.running = false;
      const order = [...cars].sort((a, b) => a.finishTick - b.finishTick).map((c) => c.name);
      io.to(room.id).emit('finished', { winner: winner ? winner.name : null, order });
    }
  }, TICK_MS);
}

function leaveRoom(socket) {
  const roomId = socketRoom.get(socket.id);
  if (!roomId) return;
  socketRoom.delete(socket.id);
  socket.leave(roomId);
  const room = rooms.get(roomId);
  if (!room) return;
  room.players.delete(socket.id);
  if (room.players.size === 0) teardownRoom(room);
  else broadcastLobby(room);
}

function parseCommand(raw) {
  if (raw && typeof raw === 'object') return { type: raw.type, args: raw.args ?? [] };
  const parts = String(raw || '').trim().split(/\s+/);
  return { type: (parts[0] || '').toLowerCase(), args: parts.slice(1) };
}

io.on('connection', (socket) => {
  socket.on('command', (raw) => {
    const { type, args } = parseCommand(raw);
    switch (type) {
      case 'join': {
        let roomId, name;
        if (args.length >= 2) {
          roomId = args[0];
          name = args.slice(1).join(' ');
        } else if (args.length === 1) {
          roomId = findOpenRoomId();
          name = args[0];
        } else {
          roomId = findOpenRoomId();
          name = `Player-${socket.id.slice(0, 4)}`;
        }

        const room = getOrCreateRoom(roomId);
        if (room.running) {
          socket.emit('message', `Room "${roomId}" has a race in progress — wait for the next one.`);
          return;
        }
        leaveRoom(socket);
        socket.join(roomId);
        socketRoom.set(socket.id, roomId);
        room.players.set(socket.id, createCar({ name }));
        socket.emit('message', `Joined room "${roomId}" as "${name}". Type "start" to begin.`);
        broadcastLobby(room);
        break;
      }
      case 'start': {
        const room = rooms.get(socketRoom.get(socket.id));
        if (!room) return socket.emit('message', 'Join a room first: join <room> <name>');
        startRace(room);
        break;
      }
      case 'boost': {
        const room = rooms.get(socketRoom.get(socket.id));
        const car = room?.players.get(socket.id);
        if (!car) return socket.emit('message', 'Join a room first: join <room> <name>');
        if (!room.running || car.finished) return;
        car.boostTicks = BOOST_TICKS;
        break;
      }
      case 'quit':
        leaveRoom(socket);
        socket.disconnect(true);
        break;
      default:
        socket.emit('message', `Unknown command: "${type}". Try: join <room> <name>, start, boost, quit`);
    }
  });

  socket.on('disconnect', () => leaveRoom(socket));
});

httpServer.listen(PORT, () => {
  console.log(`🏁 Car Race server listening on http://localhost:${PORT}`);
  console.log('   Connect clients with: node src/client.js');
});
