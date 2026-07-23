// Phase 3: thin terminal client. Sends typed commands to the server and renders
// ONLY the state the server broadcasts — it never simulates positions locally.
// Reuses the Phase 2 render() so the visuals match the local CLI exactly.
// Usage: node src/client.js [serverUrl]   (default http://localhost:3000)
import readline from 'node:readline';
import { io } from 'socket.io-client';
import { render, CLEAR_SCREEN } from './render.js';

const url = process.argv[2] || 'http://localhost:3000';
const socket = io(url);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: '> ' });

// Keep the last rendered frame so we can repaint it above the prompt on demand.
let lastFrame = 'Connecting to ' + url + ' …';
let status = '';

let room = '(no room)';

function paint() {
  process.stdout.write(CLEAR_SCREEN);
  process.stdout.write(`🏁  CAR RACE (multiplayer)   room: ${room}\n\n`);
  process.stdout.write(lastFrame + '\n');
  if (status) process.stdout.write('\n' + status + '\n');
  process.stdout.write('\nCommands: join <room> <name> | start | boost | quit\n');
  rl.prompt(true);
}

socket.on('connect', () => {
  status = 'Connected. Type: join <room> <name>';
  paint();
});

socket.on('lobby', (data) => {
  const { players, running } = data;
  if (data.room) room = data.room;
  if (!running) {
    lastFrame = players.length
      ? `Waiting room "${room}":\n  ` + players.map((p) => '• ' + p).join('\n  ')
      : `Room "${room}" is empty.`;
    paint();
  }
});

socket.on('countdown', (n) => {
  status = '   ' + n;
  paint();
});

socket.on('tick', ({ cars, trackLength }) => {
  lastFrame = render(cars, trackLength);
  status = 'racing… (type "boost" for a speed burst)';
  paint();
});

socket.on('finished', ({ winner, order }) => {
  status = '🏆  WINNER: ' + winner + '\nFinal order: ' + order.join(' → ');
  paint();
});

socket.on('message', (text) => {
  status = text;
  paint();
});

socket.on('disconnect', () => {
  status = 'Disconnected from server.';
  paint();
});

// Every typed line becomes a command sent to the server.
rl.on('line', (line) => {
  const text = line.trim();
  if (!text) return rl.prompt();
  const [type, ...args] = text.split(/\s+/);
  socket.emit('command', { type: type.toLowerCase(), args });
  if (type.toLowerCase() === 'quit') {
    rl.close();
    process.exit(0);
  }
  rl.prompt();
});

rl.on('SIGINT', () => {
  socket.emit('command', { type: 'quit' });
  rl.close();
  process.exit(0);
});
