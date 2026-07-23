// Shared race tuning constants. Kept dependency-free so every phase can import them.

export const TRACK_LENGTH = 10000; // distance a car must cover to finish
export const TICK_MS = 100; // wall-clock interval between ticks in the live loops

export const DEFAULT_ACCELERATION = 0.4; // speed gained per tick
export const DEFAULT_MAX_SPEED = 5; // speed ceiling per tick

// Boost is exercised from Phase 3 onward, but the parameter exists from the start
// so the engine signature never changes.
export const BOOST_MULTIPLIER = 2;
export const BOOST_TICKS = 10; // how many ticks a single boost lasts
