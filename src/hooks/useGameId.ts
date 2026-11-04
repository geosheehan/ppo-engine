import { useSyncExternalStore } from 'react';

const GAME_PARAM = 'game';
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
   listeners.add(listener);
   window.addEventListener('popstate', listener);
   return () => {
      listeners.delete(listener);
      window.removeEventListener('popstate', listener);
   };
};

const getGameId = () => new URLSearchParams(window.location.search).get(GAME_PARAM) ?? undefined;

function selectGame(id: string) {
   const url = new URL(window.location.href);
   url.searchParams.set(GAME_PARAM, id);
   window.history.pushState(null, '', url);
   // pushState doesn't fire popstate, so subscribers are told directly.
   listeners.forEach((listener) => listener());
}

export function useGameId(): [string | undefined, (id: string) => void] {
   return [useSyncExternalStore(subscribe, getGameId), selectGame];
}
