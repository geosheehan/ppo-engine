import { describe, expect, it } from 'vitest';
import { runPenaltyEngine } from '@engine/penaltyEngine';
import { countPowerPlays, totalsAt } from '@engine/powerPlayCounter';
import { strengthAt } from '@engine/strength';
import { indexGame } from '@domain/game';
import { scenarioGame } from '@domain/scenario';
import type { ScenarioEvent } from '@domain/scenario';

const engineFor = (events: ScenarioEvent[]) => runPenaltyEngine(indexGame(scenarioGame(events)));

describe('the engine on a scenario game', () => {
   it('serves a lone minor as a 5-on-4 that runs out after two minutes', () => {
      const result = engineFor([
         { id: 1, kind: 'penalty', side: 'away', time: 300, penaltyType: 'minor' },
      ]);
      expect(strengthAt(result.timeline, 360)).toEqual({ away: 4, home: 5 });
      expect(result.servedPenalties).toMatchObject([
         { penaltyEventId: 1, start: 300, end: 420, endReason: 'expired' },
      ]);
      expect(totalsAt(countPowerPlays(result.timeline), 3600).home).toEqual([
         { label: '5v4', opportunities: 1, goals: 0, seconds: 120 },
      ]);
   });

   it('releases the minor on a power-play goal', () => {
      const result = engineFor([
         { id: 1, kind: 'penalty', side: 'away', time: 300, penaltyType: 'minor' },
         { id: 2, kind: 'goal', side: 'home', time: 345 },
      ]);
      expect(result.servedPenalties).toMatchObject([{ end: 345, endReason: 'goal' }]);
      expect(result.goals).toMatchObject([
         { goalEventId: 2, strength: { away: 4, home: 5 }, releasedPenaltyEventId: 1 },
      ]);
   });

   it('plays one minor each at the same second 4-on-4', () => {
      const result = engineFor([
         { id: 1, kind: 'penalty', side: 'away', time: 300, penaltyType: 'minor' },
         { id: 2, kind: 'penalty', side: 'home', time: 300, penaltyType: 'minor' },
      ]);
      expect(strengthAt(result.timeline, 360)).toEqual({ away: 4, home: 4 });
      expect(result.servedPenalties.every((penalty) => penalty.coincidental)).toBe(true);
   });

   it('runs a penalty across a period break', () => {
      const result = engineFor([
         { id: 1, kind: 'penalty', side: 'home', time: 1140, penaltyType: 'major' },
      ]);
      expect(result.servedPenalties).toMatchObject([{ start: 1140, end: 1440 }]);
   });

   it('cuts off a penalty still running at the final horn', () => {
      const result = engineFor([
         { id: 1, kind: 'penalty', side: 'home', time: 3540, penaltyType: 'minor' },
      ]);
      expect(result.servedPenalties).toMatchObject([{ end: 3600, endReason: 'gameEnd' }]);
   });
});
