import type { ParticipantCard, ParticipantLayout } from '@layout/types';

export type RoleNumbers = {
   role: string;
   numbers: number[];
};

export const participantRoles = (layout: ParticipantLayout<ParticipantCard>): RoleNumbers[] =>
   layout.lists
      .flatMap(({ cards }) => cards)
      .toSorted((a, b) => a.order - b.order)
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
