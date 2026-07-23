// Pure string-building for the ASCII race view. No I/O here so the Phase 3 client
// can reuse render() to draw whatever state the server broadcasts.

const CLEAR_SCREEN = '\x1b[2J\x1b[H'; // clear + move cursor to home
const CAR = '🏎️';
const FINISH = '🏁';

// Longest name determines the label column width so the track bars line up.
function labelWidth(cars) {
  return cars.reduce((w, c) => Math.max(w, c.name.length), 4);
}

// Width available for the track bar, derived from the terminal, with a fallback
// for non-TTY contexts (e.g. piped output or the networked client).
function barWidth(cars) {
  const cols = process.stdout.columns || 80;
  const reserved = labelWidth(cars) + 12; // label + speed readout + padding
  return Math.max(10, cols - reserved);
}

// One line per car: "  Name |----🏎️------------🏁" plus a speed readout.
export function render(cars, trackLength) {
  const lw = labelWidth(cars);
  const bw = barWidth(cars);
  const lines = cars.map((car) => {
    const ratio = Math.min(1, car.position / trackLength);
    const pos = Math.round(ratio * (bw - 1));
    const cells = [];
    for (let i = 0; i < bw; i++) {
      if (i === pos && !car.finished) cells.push(CAR);
      else if (i === bw - 1) cells.push(FINISH);
      else cells.push('-');
    }
    const tag = car.finished ? ` ✔ #${car.finishTick}` : ` ${car.speed.toFixed(1)}`;
    return `  ${car.name.padStart(lw)} |${cells.join('')}|${tag}`;
  });
  return lines.join('\n');
}

// Full-frame redraw used by the live loop: clears the screen, then draws header,
// track, and an optional status/footer line.
export function renderScreen(cars, trackLength, { header = '', footer = '' } = {}) {
  const parts = [CLEAR_SCREEN];
  if (header) parts.push(header, '');
  parts.push(render(cars, trackLength));
  if (footer) parts.push('', footer);
  process.stdout.write(parts.join('\n') + '\n');
}

export { CLEAR_SCREEN };
