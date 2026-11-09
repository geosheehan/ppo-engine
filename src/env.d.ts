// oxlint-disable-next-line typescript/consistent-type-definitions -- extending Vite's type requires an interface
interface ImportMetaEnv {
   readonly VITE_GAME_VIEWS?: string;
   readonly VITE_GAME_SOURCE?: 'local' | 'worker';
   readonly VITE_WORKER_URL?: string;
}
