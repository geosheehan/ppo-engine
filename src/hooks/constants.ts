export const LOOPS = 3;
export const LEAD_MS = 400;
export const TRAVEL_MS = 700;
export const HOLD_MS = 1000;
export const LOOP_MS = LEAD_MS + TRAVEL_MS + HOLD_MS;
export const LOOPS_MS = LOOPS * LOOP_MS;
export const REST_MS = 1000;
export const SHOT_ANIMATION_MS = LOOPS_MS + REST_MS;

// How long a goal stays on screen before the replay moves on: one full shot animation.
export const GOAL_HOLD_MS = SHOT_ANIMATION_MS;
export const SAME_SECOND_HOLD_MS = 3000;
// In a fixed-length replay, a goal step gets this many normal steps' share of the time.
export const GOAL_STEP_WEIGHT = 3;
