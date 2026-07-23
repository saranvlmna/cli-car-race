import { BOOST_MULTIPLIER } from './constants.js';

export function updateSpeed(car, boostActive = false) {
  if (car.finished) return car;
  const accel = car.acceleration * (boostActive ? BOOST_MULTIPLIER : 1);
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
    car.position = trackLength;
    car.finished = true;
    car.finishTick = tickCount;
  }
  return car;
}

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

export function computeWinner(cars) {
  let best = null;
  for (const car of cars) {
    if (car.finishTick == null) continue;
    if (best === null || car.finishTick < best.finishTick) best = car;
  }
  return best;
}
