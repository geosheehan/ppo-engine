export const SIDES = {
   AWAY: 'away',
   HOME: 'home',
} as const;

// Everything below is a value the NHL API sends.

export const GAME_TYPES = {
   PRESEASON: 1,
   REGULAR_SEASON: 2,
   PLAYOFFS: 3,
} as const;

export const PLAY_TYPES = {
   BLOCKED_SHOT: 'blocked-shot',
   DELAYED_PENALTY: 'delayed-penalty',
   FACEOFF: 'faceoff',
   GAME_END: 'game-end',
   GIVEAWAY: 'giveaway',
   GOAL: 'goal',
   HIT: 'hit',
   MISSED_SHOT: 'missed-shot',
   PENALTY: 'penalty',
   PERIOD_END: 'period-end',
   PERIOD_START: 'period-start',
   SHOT_ON_GOAL: 'shot-on-goal',
   STOPPAGE: 'stoppage',
   TAKEAWAY: 'takeaway',
} as const;

export const PERIOD_TYPES = {
   REGULATION: 'REG',
   OVERTIME: 'OT',
   SHOOTOUT: 'SO',
} as const;

export const PENALTY_SEVERITIES = {
   MINOR: 'MIN',
   BENCH_MINOR: 'BEN',
   MAJOR: 'MAJ',
   MATCH: 'MAT',
   MISCONDUCT: 'MIS',
   GAME_MISCONDUCT: 'GAM',
   PENALTY_SHOT: 'PS',
} as const;

export const ZONE_CODES = {
   OFFENSIVE: 'O',
   NEUTRAL: 'N',
   DEFENSIVE: 'D',
} as const;

export const DEFENDING_SIDES = {
   LEFT: 'left',
   RIGHT: 'right',
} as const;

export const POSITION_CODES = {
   LEFT_WING: 'L',
   CENTER: 'C',
   RIGHT_WING: 'R',
   DEFENSE: 'D',
   GOALIE: 'G',
} as const;

// situationCode is [away goalie][away skaters][home skaters][home goalie]; a penalty shot is one skater against a goalie.
export const PENALTY_SHOT_SITUATIONS = {
   AWAY_SHOOTER: '0101',
   HOME_SHOOTER: '1010',
} as const;

export const SHIFT_TYPE_CODE = 517;

export const PERIOD_SECONDS = 20 * 60;

export const LINE_CHANGE = 'line-change';
