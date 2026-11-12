import type {
   DEFENDING_SIDES,
   GAME_TYPES,
   LINE_CHANGE,
   PENALTY_SEVERITIES,
   PERIOD_TYPES,
   PLAY_TYPES,
   POSITION_CODES,
   SIDES,
   ZONE_CODES,
} from '@domain/constants';

type ValueOf<T> = T[keyof T];

export type GameElapsed = number;

export type Side = ValueOf<typeof SIDES>;

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
export type StoppagePlay = PlayWith<typeof PLAY_TYPES.STOPPAGE, StoppageDetails>;

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
   | StoppagePlay
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
   gameDate: string;
   regPeriods: number;
   homeTeam: Team;
   awayTeam: Team;
   plays: Play[];
   rosterSpots: Player[];
};

export type TimedShift = {
   playerId: number;
   teamId: number;
   start: GameElapsed;
   end: GameElapsed;
};

export type OnIceIndex = {
   changes: GameElapsed[];
   onIce: TimedShift[][];
   startingAt: Map<GameElapsed, TimedShift[]>;
   endingAt: Map<GameElapsed, TimedShift[]>;
};

export type ReplayPosition = {
   index: number;
   time: GameElapsed;
   changedTeamId?: number;
};

export type ReplayStep = ReplayPosition;

export type StepType = PlayType | typeof LINE_CHANGE;

export type LineChange = {
   off: number[];
   on: number[];
};

export type GameIndex = {
   game: Game;
   // In game order; game.plays keeps the order the feed sent them in.
   plays: Play[];
   penalties: PenaltyPlay[];
   shifts: TimedShift[];
   onIceIndex: OnIceIndex;
   colors: { home: string; away: string };
   teamById: (teamId: number) => Team | undefined;
   playerById: (playerId: number) => Player | undefined;
   teamByHomeOrAway: (side: Side) => Team;
   sideOf: (teamId: number) => Side;
   teamColor: (teamId: number) => string;
};

export type ScheduleTeam = { abbrev: string; score?: number };

// The Worker's trimmed form of the NHL schedule.
export type ScheduleGame = {
   id: number;
   gameType: GameType;
   gameState: string;
   gameScheduleState: string;
   startTimeUTC: string;
   awayTeam: ScheduleTeam;
   homeTeam: ScheduleTeam;
   lastPeriodType?: PeriodType;
};

export type ScheduleDay = { date: string; games: ScheduleGame[] };

export type ScheduleWeek = {
   weekStart: string;
   previousStartDate?: string;
   nextStartDate?: string;
   preSeasonStartDate?: string;
   regularSeasonStartDate?: string;
   regularSeasonEndDate?: string;
   playoffEndDate?: string;
   days: ScheduleDay[];
};
