import { describe, expect, it } from 'vitest';
import { EN_DASH } from '@layout/constants';
import { whyNotes } from '@layout/whyNotes';
import { runPenaltyEngine } from '@engine/penaltyEngine';
import { indexGame } from '@domain/game';
import { scenarioEnd, scenarioGame } from '@domain/scenario';
import type { ScenarioEvent, ScenarioSetup } from '@domain/scenario';

const ONE_REG: ScenarioSetup = { gameType: 'regular', regulation: 1, overtime: 0 };
const ABBREVS = { away: 'AWY', home: 'HOM' };

function notesFor(events: ScenarioEvent[], setup: ScenarioSetup = ONE_REG) {
   const index = indexGame(scenarioGame(events, setup));
   const result = runPenaltyEngine(index);
   return whyNotes({
      result,
      plays: index.plays,
      penalties: index.penalties,
      regPeriods: setup.regulation,
      abbrevs: ABBREVS,
      gameEnd: scenarioEnd(events, setup),
      sweaterNumberOf: ({ details }) =>
         details.committedByPlayerId !== undefined
            ? index.playerById(details.committedByPlayerId)?.sweaterNumber
            : undefined,
   });
}

const minor = (id: number, side: 'away' | 'home', time: number, player = id): ScenarioEvent => ({
   id,
   kind: 'penalty',
   side,
   time,
   penaltyType: 'minor',
   player,
});

describe('whyNotes', () => {
   it('explains a plain minor without a tag', () => {
      const { rows, pieces } = notesFor([minor(1, 'away', 120)]);
      expect(rows).toMatchObject([
         {
            eventId: 1,
            served: `P1 2:00 ${EN_DASH} 4:00`,
            tag: undefined,
            text: 'Starts when called. Served in full',
         },
      ]);
      expect(pieces.get('1-0')?.tag).toBeUndefined();
   });

   it('tags coincidental minors 4-on-4, home first', () => {
      const { rows } = notesFor([minor(1, 'away', 120), minor(2, 'home', 120)]);
      expect(rows.map(({ side, tag }) => [side, tag])).toEqual([
         ['home', '4-on-4'],
         ['away', '4-on-4'],
      ]);
   });

   it('tags a released minor with the goal', () => {
      const { rows } = notesFor([
         minor(1, 'away', 120),
         { id: 2, kind: 'goal', side: 'home', time: 150 },
      ]);
      expect(rows).toMatchObject([
         {
            tag: 'Released',
            text: 'Released by HOM goal, P1 2:30',
            served: `P1 2:00 ${EN_DASH} 2:30`,
         },
      ]);
   });

   it('tags a third penalty that waits for a clock', () => {
      const { rows } = notesFor([
         minor(1, 'away', 120),
         minor(2, 'away', 130),
         minor(3, 'away', 140),
      ]);
      expect(rows.find(({ eventId }) => eventId === 3)).toMatchObject({
         tag: 'Waiting',
         served: `P1 4:00 ${EN_DASH} 6:00`,
      });
   });

   it('tags the second half of a double minor', () => {
      const { rows } = notesFor([
         {
            id: 1,
            kind: 'penalty',
            side: 'away',
            time: 120,
            penaltyType: 'double-minor',
            player: 1,
         },
      ]);
      expect(rows.map(({ tag, text }) => [tag, text])).toEqual([
         ['1st half', 'First half of the double minor. Served in full'],
         ['2nd half', 'Second half of the double minor'],
      ]);
   });

   it('lists a second half released the second it starts', () => {
      const { rows } = notesFor([
         {
            id: 1,
            kind: 'penalty',
            side: 'away',
            time: 300,
            penaltyType: 'double-minor',
            player: 1,
         },
         { id: 2, kind: 'goal', side: 'home', time: 420 },
      ]);
      expect(rows).toMatchObject([
         { half: 1, tag: '1st half', served: `P1 5:00 ${EN_DASH} 7:00` },
         {
            half: 2,
            tag: '2nd half, Released',
            served: `P1 7:00 ${EN_DASH} 7:00`,
            text: 'Second half of the double minor. Released by HOM goal, P1 7:00',
         },
      ]);
   });

   it("tags a same-second minor after the player's major", () => {
      const { rows } = notesFor([
         { id: 1, kind: 'penalty', side: 'away', time: 120, penaltyType: 'major', player: 1 },
         minor(2, 'away', 120, 1),
      ]);
      expect(rows.find(({ eventId }) => eventId === 2)?.tag).toBe('After major');
   });

   it('tags a later minor added to a player in the box', () => {
      const { rows } = notesFor([minor(1, 'away', 120), minor(2, 'away', 150, 1)]);
      expect(rows.find(({ eventId }) => eventId === 2)?.tag).toBe('Added');
   });

   it('tags a penalty cut off by the end of the game', () => {
      const { rows } = notesFor([minor(1, 'away', 1140)]);
      expect(rows).toMatchObject([{ tag: 'Game over', served: `P1 19:00 ${EN_DASH} 20:00` }]);
   });

   it('lists a washed minor as not served and tags the goal', () => {
      const { rows, goals } = notesFor([
         minor(1, 'away', 300),
         { id: 2, kind: 'goal', side: 'home', time: 300 },
      ]);
      expect(rows).toMatchObject([
         { eventId: 1, side: 'away', served: 'Not served', tag: 'Washed' },
      ]);
      expect(goals.get(2)?.text).toBe('Washed out by HOM goal on the delayed call, P1 5:00');
   });

   it('lists a washed first half of a double minor before its served second half', () => {
      const { rows } = notesFor([
         {
            id: 1,
            kind: 'penalty',
            side: 'away',
            time: 300,
            penaltyType: 'double-minor',
            player: 1,
         },
         { id: 2, kind: 'goal', side: 'home', time: 300 },
      ]);
      expect(rows).toMatchObject([
         { half: 1, served: 'Not served', tag: 'Washed' },
         {
            half: 2,
            served: `P1 5:00 ${EN_DASH} 7:00`,
            tag: '2nd half',
            text: 'Second half of the double minor',
         },
      ]);
   });

   it('lists offsetting penalties as not served', () => {
      const { rows } = notesFor([
         minor(1, 'away', 300),
         minor(2, 'away', 330),
         minor(3, 'home', 330),
      ]);
      expect(rows.filter(({ served }) => served === 'Not served')).toMatchObject([
         { eventId: 3, side: 'home', tag: 'Coincidental', text: 'Offset by AWY #2 Minor' },
         { eventId: 2, side: 'away', tag: 'Coincidental', text: 'Offset by HOM #3 Minor' },
      ]);
   });

   it('gives every row its own key when both halves of a double minor are offset', () => {
      const { rows } = notesFor([
         minor(1, 'away', 60),
         {
            id: 2,
            kind: 'penalty',
            side: 'away',
            time: 110,
            penaltyType: 'double-minor',
            player: 2,
         },
         minor(3, 'home', 110),
         minor(4, 'home', 110),
      ]);
      const offset = rows.filter(({ tag }) => tag === 'Coincidental');
      expect(offset.map(({ eventId }) => eventId).toSorted((a, b) => a - b)).toEqual([2, 2, 3, 4]);
      const keys = rows.map(({ key }) => key);
      expect(new Set(keys).size).toBe(keys.length);
   });

   it('lists a major to a player in the box as discarded', () => {
      const { rows } = notesFor([
         minor(1, 'away', 120),
         { id: 2, kind: 'penalty', side: 'away', time: 150, penaltyType: 'major', player: 1 },
      ]);
      expect(rows.find(({ eventId }) => eventId === 2)).toMatchObject({
         served: 'Not served',
         tag: 'Discarded',
      });
   });
});
