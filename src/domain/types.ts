import { PLAY_TYPES, SIDES } from '@domain/constants';
import type { DEFENDING_SIDES, GAME_TYPES, PENALTY_SEVERITIES, PERIOD_TYPES, POSITION_CODES, ZONE_CODES } from '@domain/constants';

type ValueOf<T> = T[keyof T];

export type GameElapsed = number;

export type Side = ValueOf<typeof SIDES>;

export const otherSide = (side: Side): Side => (side === SIDES.HOME ? SIDES.AWAY : SIDES.HOME);

export type GameType = ValueOf<typeof GAME_TYPES>;
export type PlayType = ValueOf<typeof PLAY_TYPES>;
export type PeriodType = ValueOf<typeof PERIOD_TYPES>;
export type PenaltySeverity = ValueOf<typeof PENALTY_SEVERITIES>;
export type ZoneCode = ValueOf<typeof ZONE_CODES>;
export type HomeTeamDefendingSide = ValueOf<typeof DEFENDING_SIDES>;
export type PositionCode = ValueOf<typeof POSITION_CODES>;

export type PeriodDescriptor = {
   number: number;
   periodType: PeriodType;
   maxRegulationPeriods: number;
};

export type Play = {
   eventId: number;
   periodDescriptor: PeriodDescriptor;
   timeInPeriod: string;
   timeRemaining: string;
   situationCode?: string;
   homeTeamDefendingSide?: HomeTeamDefendingSide;
   typeCode: number;
   typeDescKey: PlayType;
   sortOrder: number;
   details?: unknown;
};

export type Team = {
   id: number;
   commonName: { default: string; };
   abbrev: string;
   sog: number;
   logo: string;
   darkLogo: string;
   placeName: { default: string; };
};

export type Player = {
   teamId: number;
   playerId: number;
   firstName: { default: string };
   lastName: { default: string };
   sweaterNumber: number;
   positionCode: PositionCode;
   headshot: string;
};

export type PenaltyDetails = {
   typeCode: PenaltySeverity;
   descKey: string;
   duration: number;
   eventOwnerTeamId: number;
   committedByPlayerId?: number;
   servedByPlayerId?: number;
   drawnByPlayerId?: number;
};

export type PenaltyPlay = Play & {
   typeDescKey: typeof PLAY_TYPES.PENALTY;
   details: PenaltyDetails;
}

export type ShotType = 'backhand' | 'bat' | 'deflected' | 'slap'
   | 'snap' | 'tip-in' | 'wrap-around' | 'wrist';

export type GoalDetails = {
   shotType: ShotType;
   scoringPlayerId: number;
   scoringPlayerTotal: number;
   assist1PlayerId: number;
   assist1PlayerTotal: number;
   eventOwnerTeamId: number;
   xCoord?: number;
   yCoord?: number;
   goalieInNetId: number;
   awayScore: number;
   homeScore: number;
   highlightClipSharingUrl?: string;
}

export type GoalPlay = Play & {
   typeDescKey: typeof PLAY_TYPES.GOAL;
   details: GoalDetails;
}

export type Shift = {
   playerId: number;
   teamId: number;
   period: number;
   startTime: string;
   endTime: string;
   typeCode: number;
};

export type ShiftChart = {
   data: Shift[];
};

export type Game = {
   season: number;
   gameType: GameType;
   regPeriods: number;
   homeTeam: Team;
   awayTeam: Team;
   plays: Play[];
   rosterSpots: Player[];
};

export const isPenalty = (play: Play): play is PenaltyPlay => play.typeDescKey === PLAY_TYPES.PENALTY;
export const isGoal = (play: Play): play is GoalPlay => play.typeDescKey === PLAY_TYPES.GOAL;