import raw from '@data/games/20261028-SEAvTOR.json';
import rawShifts from '@data/shifts/20261028-SEAvTOR-shifts.json';
// import raw from '@data/games/20110211-NYIvPIT.json';
// import rawShifts from '@data/shifts/20110211-NYIvPIT-shifts.json';
import type { Game, ShiftChart } from '@domain/types';
export const game = raw as unknown as Game;
export const shifts = (rawShifts as ShiftChart).data;
