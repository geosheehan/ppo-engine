import '@components/PenaltyChart.css';
import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { useGame } from '@context/useGame.ts';
import { chartMoments, momentClock, momentPeriod } from '@layout/penaltyChart.ts';
import { SIDES } from '@domain/constants.ts';
import { periodLabel } from '@domain/labels.ts';
import { penaltyDisplayName } from '@domain/penalties.ts';
import { playerShortName } from '@domain/players.ts';
import type { GameElapsed, Side } from '@domain/types.ts';
import type { PenaltyClock } from '@engine/types.ts';

const TEAM_ROWS: Side[] = [SIDES.AWAY, SIDES.HOME];

// Rows 1 and 2 hold the period and time labels. Each team then gets a row per penalty clock, with a spacer
// row between the teams.
const laneRow = (side: Side, penaltyClock: PenaltyClock): number => 3 + TEAM_ROWS.indexOf(side) * 3 + penaltyClock;

function PenaltyChart() {
   const { game, penalties, penaltyResult, colors, teamByHomeOrAway, playerById } = useGame();
   const served = useMemo(() => penaltyResult.servedPenalties.filter(({ start, end }) => start < end), [penaltyResult]);
   const penaltyById = useMemo(() => new Map(penalties.map((play) => [play.eventId, play])), [penalties]);

   const moments = chartMoments(served);
   // Each moment is a column line, after the team label column.
   const line = (time: GameElapsed): number => moments.indexOf(time) + 2;
   const startsPeriod = (i: number): boolean => i === 0 || momentPeriod(moments[i - 1]) !== momentPeriod(moments[i]);

   return (
      <div className="penalty-chart">
         <div className="penalty-chart__grid" style={{ '--intervals': Math.max(moments.length - 1, 1) } as CSSProperties}>
            {TEAM_ROWS.map((side) => (
               <div key={side} className="penalty-chart__team" style={{ gridRow: `${laneRow(side, 0)} / span 2` }}>
                  {teamByHomeOrAway(side).abbrev}
               </div>
            ))}
            {TEAM_ROWS.flatMap((side) => ([0, 1] as const).map((penaltyClock) => (
               <div key={`${side}-${penaltyClock}`} className="penalty-chart__lane" style={{ gridRow: laneRow(side, penaltyClock) }} />
            )))}

            {moments.map((time, i) => startsPeriod(i) && i > 0 && (
               <div key={`break-${time}`} className="penalty-chart__period-break" style={{ gridColumn: line(time) - 1 }} />
            ))}
            {moments.map((time, i) => startsPeriod(i) && (
               <span key={`period-${time}`} className="penalty-chart__period" style={{ gridColumn: line(time) }}>
                  {periodLabel(momentPeriod(time), game.regPeriods)}
               </span>
            ))}
            {moments.map((time) => (
               <time key={`time-${time}`} className="penalty-chart__time" style={{ gridColumn: line(time) }}>
                  {momentClock(time)}
               </time>
            ))}

            {served.map((penalty) => {
               const play = penaltyById.get(penalty.penaltyEventId);
               if (!play) return null;
               const playerId = play.details.committedByPlayerId ?? play.details.servedByPlayerId;
               const player = playerId ? playerById(playerId) : undefined;
               const infraction = penaltyDisplayName(play.details.descKey);
               const modifiers = [penalty.coincidental && 'coincidental', penalty.endReason === 'goal' && 'goal']
                  .filter(Boolean)
                  .map((modifier) => ` penalty-chart__box--${modifier}`)
                  .join('');
               return (
                  <div
                     key={`${penalty.penaltyEventId}-${penalty.doubleMinorHalf ?? 0}`}
                     className={`penalty-chart__box${modifiers}`}
                     title={`${playerShortName(player)} · ${infraction} · ${play.details.duration} min`}
                     style={{
                        gridColumn: `${line(penalty.start)} / ${line(penalty.end)}`,
                        gridRow: laneRow(penalty.side, penalty.penaltyClock),
                        '--team-color': colors[penalty.side],
                     } as CSSProperties}
                  >
                     {player ? `#${player.sweaterNumber}` : infraction}
                  </div>
               );
            })}
         </div>
      </div>
   );
};

export default PenaltyChart;
