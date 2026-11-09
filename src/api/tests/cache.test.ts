import { describe, expect, it, vi } from 'vitest';
import { withCache } from '@api/cache';
import type { GamePpo, PpoApi } from '@api/types';
import type { ScheduleWeek } from '@domain/types';

const fakeApi = (): PpoApi => ({
   listGames: vi.fn(() => Promise.resolve([])),
   getGamePpo: vi.fn(() => Promise.resolve({} as GamePpo)),
   getSchedule: vi.fn((weekStart: string) =>
      Promise.resolve({ weekStart, days: [] } as ScheduleWeek),
   ),
});

describe('withCache', () => {
   it('returns the same promise for repeated requests', () => {
      const api = fakeApi();
      const cached = withCache(api);
      expect(cached.listGames()).toBe(cached.listGames());
      expect(cached.getGamePpo('a')).toBe(cached.getGamePpo('a'));
      expect(api.listGames).toHaveBeenCalledTimes(1);
      expect(api.getGamePpo).toHaveBeenCalledTimes(1);
   });

   it('requests each game separately', () => {
      const api = fakeApi();
      const cached = withCache(api);
      expect(cached.getGamePpo('a')).not.toBe(cached.getGamePpo('b'));
      expect(api.getGamePpo).toHaveBeenCalledTimes(2);
   });

   it('keeps a failed game until it is forgotten, then requests it again', async () => {
      const api = fakeApi();
      vi.mocked(api.getGamePpo).mockRejectedValueOnce(new Error('down'));
      const cached = withCache(api);
      const failed = cached.getGamePpo('a');
      await expect(failed).rejects.toThrow('down');
      expect(cached.getGamePpo('a')).toBe(failed);

      cached.forgetGamePpo('a');
      await expect(cached.getGamePpo('a')).resolves.toEqual({});
      expect(api.getGamePpo).toHaveBeenCalledTimes(2);
   });

   it('keeps each week until it is forgotten', async () => {
      const api = fakeApi();
      vi.mocked(api.getSchedule).mockRejectedValueOnce(new Error('down'));
      const cached = withCache(api);
      const failed = cached.getSchedule('2026-11-02');
      await expect(failed).rejects.toThrow('down');
      expect(cached.getSchedule('2026-11-02')).toBe(failed);
      expect(cached.getSchedule('2026-11-09')).not.toBe(failed);

      cached.forgetSchedule('2026-11-02');
      await expect(cached.getSchedule('2026-11-02')).resolves.toEqual({
         weekStart: '2026-11-02',
         days: [],
      });
      expect(api.getSchedule).toHaveBeenCalledTimes(3);
   });
});
