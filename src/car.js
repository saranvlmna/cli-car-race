import { DEFAULT_ACCELERATION, DEFAULT_MAX_SPEED } from './constants.js';

export function createCar({
  name,
  acceleration = DEFAULT_ACCELERATION,
  maxSpeed = DEFAULT_MAX_SPEED,
} = {}) {
  if (!name) throw new Error('createCar: name is required');
  return {
    name,
    position: 0,
    speed: 0,
    acceleration,
    maxSpeed,
    finished: false,
    finishTick: null,
    boostTicks: 0,
  };
}
