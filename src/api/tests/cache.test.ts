import { describe, expect, it, vi } from 'vitest';
import { withCache } from '@api/cache';
import type { GamePpo, PpoApi } from '@api/types';

const fakeApi = (): PpoApi => ({
   listGames: vi.fn(() => Promise.resolve([])),
   getGamePpo: vi.fn(() => Promise.resolve({} as GamePpo)),
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
});
