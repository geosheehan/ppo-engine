import { describe, expect, it } from 'vitest';
import { areSimilar, gameColors, headshotColor, matchupColors, textColorOn } from '@domain/colors';
import { DEFAULT_TEAM_COLORS } from '@domain/constants';

const RED = '#C8102E';
const NAVY = '#00205B';
const ROYAL = '#003087';
const BLACK = '#000000';
const GOLD = '#FFB81C';
const ORANGE = '#FC4C02';
const GREEN = '#046A38';
const BLUE = '#006AC6';

describe('areSimilar', () => {
   it('treats a color as similar to itself', () => {
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
   it('uses both first colors when they differ', () => {
      expect(matchupColors([RED, BLACK], [NAVY, GREEN])).toEqual({ home: RED, away: NAVY });
   });

   it('uses both second colors when the firsts are similar', () => {
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

describe('gameColors', () => {
   const { HOME: DEFAULT_HOME, AWAY: DEFAULT_AWAY } = DEFAULT_TEAM_COLORS;

   it('uses red away and blue home when neither team is known', () => {
      expect(gameColors(undefined, undefined)).toEqual({ home: DEFAULT_HOME, away: DEFAULT_AWAY });
   });

   it("gives an unknown team its side's default", () => {
      expect(gameColors([GREEN, GOLD], undefined)).toEqual({ home: GREEN, away: DEFAULT_AWAY });
      expect(gameColors(undefined, [GREEN, GOLD])).toEqual({ home: DEFAULT_HOME, away: GREEN });
   });

   it("switches an unknown team to the other default when its own looks like the known team's", () => {
      expect(gameColors([RED, BLACK], undefined)).toEqual({ home: RED, away: DEFAULT_HOME });
      expect(gameColors(undefined, [BLUE, GOLD])).toEqual({ home: DEFAULT_AWAY, away: BLUE });
   });

   it('leaves two known teams to matchupColors', () => {
      expect(gameColors([NAVY, GREEN], [ROYAL, GOLD])).toEqual({ home: GREEN, away: GOLD });
   });
});

describe('textColorOn', () => {
   it('puts white text on dark team colors', () => {
      expect(textColorOn(NAVY)).toBe('#ffffff');
      expect(textColorOn(RED)).toBe('#ffffff');
      expect(textColorOn(GREEN)).toBe('#ffffff');
   });

   it('puts black text on light team colors', () => {
      expect(textColorOn(GOLD)).toBe('#000000');
      expect(textColorOn(ORANGE)).toBe('#000000');
      expect(textColorOn('#96D8D8')).toBe('#000000');
   });
});

describe('headshotColor', () => {
   it('keeps a dark team color', () => {
      expect(headshotColor([NAVY, GOLD], NAVY)).toBe(NAVY);
      expect(headshotColor([RED], RED)).toBe(RED);
   });

   it("swaps a light color for the team's first dark one", () => {
      expect(headshotColor([GOLD, NAVY], GOLD)).toBe(NAVY);
      expect(headshotColor(['#B9975B', '#333F48', RED, BLACK], '#B9975B')).toBe('#333F48');
   });

   it('falls back to the darkest color when every team color is light', () => {
      expect(headshotColor(['#FFFFFF', GOLD], '#FFFFFF')).toBe(GOLD);
      expect(headshotColor([], GOLD)).toBe(GOLD);
   });
});
