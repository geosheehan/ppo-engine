import { afterEach, describe, expect, it, vi } from 'vitest';
import { penaltyDisplayName } from '@domain/penalties';

describe('penaltyDisplayName', () => {
   afterEach(() => {
      vi.restoreAllMocks();
   });

   it('uses the rule book name for a known key', () => {
      expect(penaltyDisplayName('interference-goalkeeper')).toBe('Goalkeeper interference');
   });

   it('falls back to the desc key for an unknown key and reports it only once', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(penaltyDisplayName('made-up-penalty')).toBe('Made up penalty');
      expect(penaltyDisplayName('made-up-penalty')).toBe('Made up penalty');
      expect(error).toHaveBeenCalledTimes(1);
      expect(error).toHaveBeenCalledWith('Unknown key: made-up-penalty');
   });
});
