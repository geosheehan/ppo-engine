import { describe, expect, it } from 'vitest';
import { areSimilar, gameColors, headshotShade, matchupColors, textColorOn } from '@domain/colors';
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

   it('treats NSH gold and VGK gold as similar', () => {
      expect(areSimilar(GOLD, '#B9975B')).toBe(true);
   });

   it('takes a different cutoff', () => {
      const looser = { cutoff: 0.15, darkContrast: 1.3 };
      expect(areSimilar(GOLD, '#B9975B', looser)).toBe(false);
      expect(matchupColors([GOLD, NAVY], ['#B9975B', BLACK], looser)).toEqual({
         home: GOLD,
         away: '#B9975B',
      });
   });

   it('treats two dark colors with little contrast as similar', () => {
      expect(areSimilar(BLACK, '#001425')).toBe(true);
      expect(areSimilar(BLACK, '#041E42')).toBe(true);
   });

   it('tells black from a brighter navy', () => {
      expect(areSimilar(BLACK, NAVY)).toBe(false);
   });

   it('tells red from navy', () => {
      expect(areSimilar(RED, NAVY)).toBe(false);
   });
});

describe('matchupColors', () => {
   it('uses both first colors when they differ', () => {
      expect(matchupColors([RED, BLACK], [NAVY, GREEN])).toEqual({ home: RED, away: NAVY });
   });

   it('switches away to its second color on a clash', () => {
      expect(matchupColors([NAVY, GREEN], [ROYAL, GOLD])).toEqual({ home: NAVY, away: GOLD });
      expect(matchupColors([BLACK, GOLD], [BLACK, GOLD])).toEqual({ home: BLACK, away: GOLD });
      expect(matchupColors([RED], [RED, NAVY])).toEqual({ home: RED, away: NAVY });
   });

   it("moves on to away's third color when its second clashes too", () => {
      expect(matchupColors([NAVY], [NAVY, ROYAL, GOLD])).toEqual({ home: NAVY, away: GOLD });
   });

   it("moves on to home's third color when away can't switch", () => {
      expect(matchupColors([NAVY, ROYAL, RED], [NAVY])).toEqual({ home: RED, away: NAVY });
   });

   it('switches home when away has no second color', () => {
      expect(matchupColors([NAVY, GREEN], [NAVY])).toEqual({ home: GREEN, away: NAVY });
   });

   it("switches home when away's second color clashes too", () => {
      expect(matchupColors([NAVY, GREEN], [ROYAL, NAVY])).toEqual({ home: GREEN, away: ROYAL });
   });

   it('keeps both firsts when no switch avoids the clash', () => {
      expect(matchupColors([NAVY], [ROYAL])).toEqual({ home: NAVY, away: ROYAL });
      expect(matchupColors([NAVY, ROYAL], [NAVY])).toEqual({ home: NAVY, away: NAVY });
      expect(matchupColors([RED], [RED, ORANGE])).toEqual({ home: RED, away: RED });
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
      expect(gameColors([NAVY, GREEN], [ROYAL, GOLD])).toEqual({ home: NAVY, away: GOLD });
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

describe('headshotShade', () => {
   it('fades dark colors toward white', () => {
      expect(headshotShade(NAVY)).toBe('white');
      expect(headshotShade(RED)).toBe('white');
      expect(headshotShade(BLACK)).toBe('white');
   });

   it('fades light colors toward black', () => {
      expect(headshotShade(GOLD)).toBe('black');
      expect(headshotShade('#7AB2E0')).toBe('black');
      expect(headshotShade('#FFFFFF')).toBe('black');
   });
});
