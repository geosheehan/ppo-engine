import 'react';

declare module 'react' {
   // oxlint-disable-next-line typescript/consistent-type-definitions -- extending React's type requires an interface
   interface CSSProperties {
      '--team-color'?: string;
      '--team-text-color'?: string;
      '--rink-left-end-color'?: string;
      '--rink-right-end-color'?: string;
      '--replay-track-progress'?: number;
      '--replay-track-goal-position'?: number;
      '--penalty-chart-interval-count'?: number;
      '--headshot-accent'?: string;
      '--swatch-color'?: string;
   }
}
