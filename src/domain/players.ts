import type { Player } from '@domain/types';

export const playerShortName = (player: Player | undefined): string =>
   player
      ? `#${player.sweaterNumber} ${player.firstName.default[0]}.${player.lastName.default}`.toUpperCase()
      : 'Unknown player';
