import { BOOST_MULTIPLIER } from './constants.js';

// Pure simulation step functions. Each mutates the car passed in and does no I/O,
// so the whole engine is trivially unit-testable and reusable by the CLI loop and
// the server tick loop alike.

export function updateSpeed(car, boostActive = false) {
  if (car.finished) return car;
  const accel = car.acceleration * (boostActive ? BOOST_MULTIPLIER : 1);
  // Boost lets a car temporarily exceed its normal max speed.
  const ceiling = boostActive ? car.maxSpeed * BOOST_MULTIPLIER : car.maxSpeed;
  car.speed = Math.min(car.speed + accel, ceiling);
  return car;
}

export function moveCar(car, dt = 1) {
  if (car.finished) return car;
  car.position += car.speed * dt;
  return car;
}

export function checkFinishLine(car, trackLength, tickCount) {
  if (!car.finished && car.position >= trackLength) {
    car.position = trackLength; // never overshoot the finish line
    car.finished = true;
    car.finishTick = tickCount;
  }
  return car;
}

// Advance every car by one tick. Returns { raceOver, winner }.
// `winner` is the car with the smallest finishTick (ties broken by array order),
// and is null until every car has finished.
export function tick(cars, trackLength, tickCount) {
  for (const car of cars) {
    const boostActive = car.boostTicks > 0;
    updateSpeed(car, boostActive);
    moveCar(car);
    checkFinishLine(car, trackLength, tickCount);
    if (car.boostTicks > 0) car.boostTicks -= 1;
  }

  const raceOver = cars.length > 0 && cars.every((c) => c.finished);
  const winner = raceOver ? computeWinner(cars) : null;
  return { raceOver, winner };
}

// Earliest finisher wins; array order breaks ties (finished same tick).
export function computeWinner(cars) {
  let best = null;
  for (const car of cars) {
    if (car.finishTick == null) continue;
    if (best === null || car.finishTick < best.finishTick) best = car;
  }
  return best;
}
