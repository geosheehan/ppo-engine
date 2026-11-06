export const GAMES_PATH = '/games';

export const GAME_VIEWS = {
   REPLAY: 'replay',
   ANALYSIS: 'analysis',
} as const;

export type GameView = (typeof GAME_VIEWS)[keyof typeof GAME_VIEWS];

export const GAME_VIEW_LABELS: Record<GameView, string> = {
   [GAME_VIEWS.REPLAY]: 'Replay',
   [GAME_VIEWS.ANALYSIS]: 'Analysis',
};

export const GAME_VIEW_PATTERN = `${GAMES_PATH}/:gameId/:view`;

export const isGameView = (value: string | undefined): value is GameView =>
   value !== undefined && Object.values<string>(GAME_VIEWS).includes(value);

export const gamePath = (gameId: string, view: GameView = GAME_VIEWS.REPLAY): string =>
   `${GAMES_PATH}/${gameId}/${view}`;
