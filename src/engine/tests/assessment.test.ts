import { describe, expect, it } from 'vitest';
import { assessPenalties } from '@engine/assessment';
import type { CalledPenalty } from '@engine/assessment';
import type { Side } from '@engine/types';

let nextId = 1;
const called = (side: Side, severity: CalledPenalty['severity'], minutes: number, playerKey = nextId): CalledPenalty =>
   ({ eventId: nextId++, side, playerKey, severity, minutes, doubleMinorFirstHalfWashed: false });

describe('assessPenalties (Rule 19)', () => {
   it('serves one minor each 4-on-4 when nothing else is in effect', () => {
      const sentences = assessPenalties([called('away', 'MIN', 2), called('home', 'MIN', 2)], false);
      expect(sentences).toHaveLength(2);
      expect(sentences.every((sentence) => sentence.coincidental)).toBe(true);
   });

   it('cancels one minor each when another penalty is already in effect', () => {
      expect(assessPenalties([called('away', 'MIN', 2), called('home', 'MIN', 2)], true)).toEqual([]);
   });

   it('cancels fighting majors', () => {
      expect(assessPenalties([called('away', 'MAJ', 5), called('home', 'MAJ', 5)], false)).toEqual([]);
   });

   it('leaves one half of a double minor against a single minor', () => {
      const sentences = assessPenalties([called('away', 'MIN', 4), called('home', 'MIN', 2)], false);
      expect(sentences).toHaveLength(1);
      expect(sentences[0]).toMatchObject({ side: 'away', coincidental: false });
      expect(sentences[0].penalties).toHaveLength(1);
   });

   it('serves only the difference when several penalties are called', () => {
      const sentences = assessPenalties([
         called('home', 'MAJ', 5), called('home', 'MAJ', 5), called('home', 'MIN', 2),
         called('away', 'MAJ', 5), called('away', 'MIN', 2),
      ], false);
      expect(sentences).toHaveLength(1);
      expect(sentences[0]).toMatchObject({ side: 'home', penalties: [{ kind: 'major' }] });
   });

   it('serves a player\'s major before his minor (Rule 20.1)', () => {
      const [sentence] = assessPenalties([called('home', 'MIN', 2, 7), called('home', 'MAJ', 5, 7)], false);
      expect(sentence.penalties.map((penalty) => penalty.kind)).toEqual(['major', 'minor']);
   });

   it('serves the minor first when coincidental majors were called (Rule 20.1)', () => {
      const sentences = assessPenalties([
         called('home', 'MAJ', 5, 7), called('home', 'MIN', 2, 7), called('home', 'MAJ', 5, 8),
         called('away', 'MAJ', 5, 9),
      ], false);
      const player7 = sentences.find((sentence) => sentence.penalties.length === 2)!;
      expect(player7.penalties.map((penalty) => penalty.kind)).toEqual(['minor', 'major']);
   });

   it('records a minor before another player\'s major (Rule 26.3)', () => {
      const sentences = assessPenalties([called('home', 'MAJ', 5, 7), called('home', 'MIN', 2, 8)], false);
      expect(sentences.map((sentence) => sentence.penalties[0].kind)).toEqual(['minor', 'major']);
   });

   it('drops the washed first half of a delayed double minor (Rule 18.2)', () => {
      const penalty = { ...called('home', 'MIN', 4), doubleMinorFirstHalfWashed: true };
      const [sentence] = assessPenalties([penalty], false);
      expect(sentence.penalties).toEqual([{ eventId: penalty.eventId, kind: 'minor', seconds: 120, doubleMinorHalf: 2 }]);
   });
});
