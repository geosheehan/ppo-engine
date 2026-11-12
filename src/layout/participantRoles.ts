import type { ParticipantCard, ParticipantLayout } from '@layout/types';

export type RoleNumbers = {
   role: string;
   numbers: number[];
};

const ASSIST_FIELDS = new Set(['assist1PlayerId', 'assist2PlayerId']);

export const participantRoles = (
   layout: ParticipantLayout<ParticipantCard>,
   { combineAssists = false } = {},
): RoleNumbers[] =>
   layout.lists
      .flatMap(({ cards }) => cards)
      .toSorted((a, b) => a.order - b.order)
      .map((card) =>
         combineAssists && ASSIST_FIELDS.has(card.field) ? { ...card, role: 'Assist' } : card,
      )
      .reduce<RoleNumbers[]>((roles, { role, player }) => {
         const last = roles.at(-1);
         if (last?.role === role) last.numbers.push(player.sweaterNumber);
         else roles.push({ role, numbers: [player.sweaterNumber] });
         return roles;
      }, []);

export const rolesLine = (roles: RoleNumbers[]): string =>
   roles
      .map(({ role, numbers }) => [role, ...numbers.map((number) => `#${number}`)].join(' '))
      .join(' · ');
