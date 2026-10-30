import raw from '@data/games/20261028-SEAvTOR.json';
import type { Game } from '@domain/types';
export const game = raw as unknown as Game;