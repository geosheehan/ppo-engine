import { PLAY_TYPES, SIDES } from '@domain/constants';
import type {
   DEFENDING_SIDES,
   GAME_TYPES,
   PENALTY_SEVERITIES,
   PERIOD_TYPES,
   POSITION_CODES,
   ZONE_CODES,
} from '@domain/constants';

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

type PlayBase = {
   eventId: number;
   periodDescriptor: PeriodDescriptor;
   timeInPeriod: string;
   timeRemaining: string;
   situationCode?: string;
   homeTeamDefendingSide?: HomeTeamDefendingSide;
   typeCode: number;
   sortOrder: number;
};

type BaseDetails = {
   eventOwnerTeamId?: number;
   xCoord?: number;
   yCoord?: number;
   zoneCode?: ZoneCode;
};

type TeamOwnedDetails = BaseDetails & { eventOwnerTeamId: number };

export type ShotType =
   'backhand' | 'bat' | 'deflected' | 'slap' | 'snap' | 'tip-in' | 'wrap-around' | 'wrist';

export type FaceoffDetails = TeamOwnedDetails & {
   winningPlayerId: number;
   losingPlayerId: number;
};

export type HitDetails = TeamOwnedDetails & {
   hittingPlayerId: number;
   hitteePlayerId: number;
};

export type ShotOnGoalDetails = TeamOwnedDetails & {
   shootingPlayerId: number;
   goalieInNetId?: number;
   shotType: ShotType;
   awaySOG: number;
   homeSOG: number;
};

export type MissedShotDetails = TeamOwnedDetails & {
   shootingPlayerId: number;
   goalieInNetId?: number;
   shotType: ShotType;
   reason: string;
};

export type BlockedShotDetails = TeamOwnedDetails & {
   shootingPlayerId: number;
   blockingPlayerId: number;
   reason?: string;
};

export type TurnoverDetails = TeamOwnedDetails & {
   playerId: number;
};

export type GoalDetails = TeamOwnedDetails & {
   shotType: ShotType;
   scoringPlayerId: number;
   scoringPlayerTotal: number;
   assist1PlayerId?: number;
   assist1PlayerTotal?: number;
   assist2PlayerId?: number;
   assist2PlayerTotal?: number;
   goalieInNetId?: number;
   awayScore: number;
   homeScore: number;
   highlightClipSharingUrl?: string;
};

export type PenaltyDetails = TeamOwnedDetails & {
   typeCode: PenaltySeverity;
   descKey: string;
   duration: number;
   committedByPlayerId?: number;
   servedByPlayerId?: number;
   drawnByPlayerId?: number;
};

export type StoppageDetails = BaseDetails & {
   reason: string;
   secondaryReason?: string;
};

type PlayWith<T extends PlayType, D> = PlayBase & { typeDescKey: T; details: D };
type PlayWithout<T extends PlayType> = PlayBase & { typeDescKey: T; details?: undefined };

export type GoalPlay = PlayWith<typeof PLAY_TYPES.GOAL, GoalDetails>;
export type PenaltyPlay = PlayWith<typeof PLAY_TYPES.PENALTY, PenaltyDetails>;

export type Play =
   | PlayWith<typeof PLAY_TYPES.BLOCKED_SHOT, BlockedShotDetails>
   | PlayWith<typeof PLAY_TYPES.DELAYED_PENALTY, TeamOwnedDetails>
   | PlayWith<typeof PLAY_TYPES.FACEOFF, FaceoffDetails>
   | PlayWith<typeof PLAY_TYPES.GIVEAWAY, TurnoverDetails>
   | GoalPlay
   | PlayWith<typeof PLAY_TYPES.HIT, HitDetails>
   | PlayWith<typeof PLAY_TYPES.MISSED_SHOT, MissedShotDetails>
   | PenaltyPlay
   | PlayWith<typeof PLAY_TYPES.SHOT_ON_GOAL, ShotOnGoalDetails>
   | PlayWith<typeof PLAY_TYPES.STOPPAGE, StoppageDetails>
   | PlayWith<typeof PLAY_TYPES.TAKEAWAY, TurnoverDetails>
   | PlayWithout<
        typeof PLAY_TYPES.GAME_END | typeof PLAY_TYPES.PERIOD_END | typeof PLAY_TYPES.PERIOD_START
     >;

export type Team = {
   id: number;
   commonName: { default: string };
   abbrev: string;
   sog: number;
   logo: string;
   darkLogo: string;
   placeName: { default: string };
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

export const isPenalty = (play: Play): play is PenaltyPlay =>
   play.typeDescKey === PLAY_TYPES.PENALTY;
export const isGoal = (play: Play): play is GoalPlay => play.typeDescKey === PLAY_TYPES.GOAL;
