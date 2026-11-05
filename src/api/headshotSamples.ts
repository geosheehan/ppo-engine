import { loadHeadshot } from '@api/headshots';
import type { Player } from '@domain/types';

export type HeadshotSample = {
   abbrev: string;
   players: Player[];
};

// Built by scripts/headshot-samples.mjs into public/, so the hosted page doesn't need the
// gitignored game files. Headshot URLs point at the NHL.
const SAMPLES_URL = `${import.meta.env.BASE_URL}headshot-debug/samples.json`;

async function loadSamples(): Promise<HeadshotSample[]> {
   const response = await fetch(SAMPLES_URL);
   if (!response.ok) throw new Error(`No headshot samples at ${SAMPLES_URL}`);
   const samples = (await response.json()) as HeadshotSample[];
   await Promise.all(
      samples.flatMap(({ players }) => players.map((player) => loadHeadshot(player.headshot))),
   );
   return samples;
}

let samples: Promise<HeadshotSample[]> | undefined;
export const headshotSamples = () => (samples ??= loadSamples());
