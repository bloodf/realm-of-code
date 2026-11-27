// The game's clock. Debug mode can move it forward (to test what happens when a player is
// away for days), so every time-based system (hearts, streaks, crops, pets) reads now().
let offset = 0;
export const now = () => Date.now() + offset;
export const setTimeOffset = (ms: number) => { offset = ms; };
export const timeOffset = () => offset;
export const DAY = 86_400_000;
export const HOUR = 3_600_000;
export const MIN = 60_000;
