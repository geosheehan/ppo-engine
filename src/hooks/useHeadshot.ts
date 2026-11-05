import { useSyncExternalStore } from 'react';
import { isHeadshotLoaded, subscribeHeadshots } from '@api/headshots';

// The URL once its image has loaded; undefined while loading, after a failure, or with no URL.
export function useHeadshot(url: string | undefined): string | undefined {
   return useSyncExternalStore(subscribeHeadshots, () =>
      url !== undefined && isHeadshotLoaded(url) ? url : undefined,
   );
}
