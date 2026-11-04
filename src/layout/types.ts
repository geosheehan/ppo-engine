import type { Player, Side, Team } from '@domain/types';

export type Position = 'left' | 'right' | 'solo';
export type LayoutCard = {
   field: string;
   side: Side;
};
export type PlacedCard<C extends LayoutCard> = C & {
   mirrored: boolean;
   apart: boolean;
};
export type ParticipantList<C extends LayoutCard> = {
   position: Position;
   cards: PlacedCard<C>[];
};
export type ParticipantLayout<C extends LayoutCard> = {
   lists: ParticipantList<C>[];
   closeAtCenter: boolean;
};
export type ParticipantCard = LayoutCard & {
   role: string;
   player: Player;
   team: Team;
   color: string;
};
