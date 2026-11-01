import { describe, expect, it } from 'vitest';
import { areSimilar, matchupColors } from '@domain/colors';

const RED = '#C8102E';
const NAVY = '#00205B';
const ROYAL = '#003087';
const BLACK = '#000000';
const GOLD = '#FFB81C';
const ORANGE = '#FC4C02';
const GREEN = '#046A38';

describe('areSimilar', () => {
   it('treats a colour as similar to itself', () => {
      expect(areSimilar(RED, RED)).toBe(true);
   });

   it('treats navy and royal blue as similar', () => {
      expect(areSimilar(NAVY, ROYAL)).toBe(true);
   });

   it('tells red from navy', () => {
      expect(areSimilar(RED, NAVY)).toBe(false);
   });
});

describe('matchupColors', () => {
   it('uses both first colours when they differ', () => {
      expect(matchupColors([RED, BLACK], [NAVY, GREEN])).toEqual({ home: RED, away: NAVY });
   });

   it('uses both second colours when the firsts are similar', () => {
      expect(matchupColors([NAVY, GREEN], [ROYAL, GOLD])).toEqual({ home: GREEN, away: GOLD });
   });

   it('gives home its first and away its second when the seconds are similar too', () => {
      expect(matchupColors([BLACK, GOLD], [BLACK, GOLD])).toEqual({ home: BLACK, away: GOLD });
   });

   it('gives home its first and away its second when home has no second', () => {
      expect(matchupColors([RED], [RED, ORANGE])).toEqual({ home: RED, away: ORANGE });
   });

   it('gives home its second when away has no second', () => {
      expect(matchupColors([NAVY, GREEN], [NAVY])).toEqual({ home: GREEN, away: NAVY });
   });

   it('keeps both firsts when neither team has a second', () => {
      expect(matchupColors([NAVY], [ROYAL])).toEqual({ home: NAVY, away: ROYAL });
   });
});
