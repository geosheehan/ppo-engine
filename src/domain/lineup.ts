import type { Player } from '@domain/types';

const POSITION_ORDER = ['L', 'C', 'R', 'D', 'G'];

export const byPosition = (a: Player, b: Player): number =>
   POSITION_ORDER.indexOf(a.positionCode) - POSITION_ORDER.indexOf(b.positionCode) || a.sweaterNumber - b.sweaterNumber;

const group = (player: Player): string => (player.positionCode === 'D' ? 'D' : 'F');

export function keepSlots(previous: Player[], current: Player[]): Player[] {
   const currentIds = new Set(current.map(({ playerId }) => playerId));
   const previousIds = new Set(previous.map(({ playerId }) => playerId));
   if (!previous.some(({ playerId }) => currentIds.has(playerId))) return current.toSorted(byPosition);

   const slots: (Player | undefined)[] = previous.map((player) => (currentIds.has(player.playerId) ? player : undefined));
   const waiting = current.filter(({ playerId }) => !previousIds.has(playerId)).toSorted(byPosition);

   const fill = (fits: (vacated: Player, arrival: Player) => boolean) => {
      for (const arrival of [...waiting]) {
         const slot = slots.findIndex((player, i) => player === undefined && fits(previous[i], arrival));
         if (slot === -1) continue;
         slots[slot] = arrival;
         waiting.splice(waiting.indexOf(arrival), 1);
      }
   };
   fill((vacated, arrival) => group(vacated) === group(arrival));
   fill(() => true);

   const lineup = slots.filter((player) => player !== undefined);
   for (const arrival of waiting) {
      const lastOfGroup = lineup.findLastIndex((player) => group(player) === group(arrival));
      const at = lastOfGroup !== -1 ? lastOfGroup + 1 : group(arrival) === 'F' ? 0 : lineup.length;
      lineup.splice(at, 0, arrival);
   }
   return lineup;
}
