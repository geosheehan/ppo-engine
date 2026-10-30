export type PeriodType = 'REG' | 'OT' | 'SO';

export type PeriodDescriptor = {
   number: number;
   periodType: PeriodType;
   maxRegulationPeriods: number;
};

export type HomeTeamDefendingSide = 'left' | 'right';

export type Play = {
   eventId: number;
   periodDescriptor: PeriodDescriptor;
   timeInPeriod: string;
   timeRemaining: string;
   situationCode?: string;
   homeTeamDefendingSide?: HomeTeamDefendingSide;
   typeCode: number;
   typeDescKey: string;
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
   positionCode: string;
   headshot: string;
};

export type PenaltySeverity = 'MIN' | 'MAJ' | 'BEN' | 'GAM' | 'MIS';

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
   typeCode: 509;
   typeDescKey: 'penalty';
   details: PenaltyDetails;
}

export type Game = {
   homeTeam: Team;
   awayTeam: Team;
   plays: Play[];
   rosterSpots: Player[];
};

export const isPenalty = (play: Play): play is PenaltyPlay => play.typeCode === 509;