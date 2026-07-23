import { DEFAULT_ACCELERATION, DEFAULT_MAX_SPEED } from './constants.js';

// Factory for a race car. A car is a plain serializable object so it can be
// broadcast over the wire unchanged once we reach the networked phases.
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
    boostTicks: 0, // remaining ticks of active boost (set by the `boost` command)
  };
}
