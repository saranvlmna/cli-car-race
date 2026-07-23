const CLEAR_SCREEN = '\x1b[2J\x1b[H';
const CAR = '🏎️';
const FINISH = '🏁';

function labelWidth(cars) {
  return cars.reduce((w, c) => Math.max(w, c.name.length), 4);
}

function barWidth(cars) {
  const cols = process.stdout.columns || 80;
  const reserved = labelWidth(cars) + 12;
  return Math.max(10, cols - reserved);
}

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

export function renderScreen(cars, trackLength, { header = '', footer = '' } = {}) {
  const parts = [CLEAR_SCREEN];
  if (header) parts.push(header, '');
  parts.push(render(cars, trackLength));
  if (footer) parts.push('', footer);
  process.stdout.write(parts.join('\n') + '\n');
}

export { CLEAR_SCREEN };
