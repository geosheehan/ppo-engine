import type { Strength } from '@engine/types';
import { GAME_TYPES, PERIOD_SECONDS, SIDES } from '@domain/constants';
import { otherSide } from '@domain/game';
import type { Game, GameElapsed, Side } from '@domain/types';

const TEAMS: Side[] = [SIDES.AWAY, SIDES.HOME];
// 3-on-3 overtime was introduced in the 2015-16 regular season.
const FIRST_THREE_ON_THREE_SEASON = 20152016;

export const isSameStrength = (a: Strength, b: Strength) => a.away === b.away && a.home === b.home;

export const strengthLabel = (strength: Strength, side: Side): string =>
   `${strength[side]}v${strength[otherSide(side)]}`;

// Regulation and playoff overtime: five skaters less one for each running penalty (never below three).
export const entitledStrength = (running: Strength): Strength => ({
   away: 5 - running.away,
   home: 5 - running.home,
});

// Rule 84.3: regular-season overtime is 3-on-3; a one-skater advantage plays 4-on-3, two skaters 5-on-3.
export function overtimeStrength(entitled: Strength): Strength {
   const advantage = entitled.away - entitled.home;
   if (advantage === 0) return { away: 3, home: 3 };
   const leader = Math.abs(advantage) >= 2 ? 5 : 4;
   return advantage > 0 ? { away: leader, home: 3 } : { away: 3, home: leader };
}

export const periodAt = (time: GameElapsed): number =>
   Math.max(1, Math.ceil(time / PERIOD_SECONDS));

export const isThreeOnThreeOvertime = (game: Game, period: number) =>
   (game.gameType === GAME_TYPES.PRESEASON || game.gameType === GAME_TYPES.REGULAR_SEASON)
   && game.season >= FIRST_THREE_ON_THREE_SEASON
   && period > game.regPeriods;

// Tracks skaters on the ice. In 3-on-3 overtime, strength is only reset at stoppages (Tables 15-16);
// during play, a player whose penalty ends simply returns, adding a skater.
export class OnIceStrength {
   private entitled: Strength = { away: 5, home: 5 };
   private onIce: Strength = { away: 5, home: 5 };

   get current(): Strength {
      return { ...this.onIce };
   }

   update(running: Strength, threeOnThree: boolean, atStoppage: boolean): Strength {
      const entitled = entitledStrength(running);
      if (!threeOnThree) {
         this.onIce = entitled;
      } else if (atStoppage) {
         this.onIce = overtimeStrength(entitled);
      } else {
         for (const side of TEAMS) {
            const returned = Math.max(0, entitled[side] - this.entitled[side]);
            this.onIce[side] = Math.min(5, this.onIce[side] + returned);
         }
      }
      this.entitled = entitled;
      return this.current;
   }
}
