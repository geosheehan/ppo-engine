import '@components/PenaltyChart.css';
import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { clsx } from 'clsx';
import { useGame } from '@context/useGame';
import { chartMoments, momentClock, momentPeriod } from '@layout/penaltyChart';
import type { PenaltyClock } from '@engine/types';
import { SIDES } from '@domain/constants';
import { periodLabel } from '@domain/labels';
import { penaltyDisplayName } from '@domain/penalties';
import { playerShortName } from '@domain/players';
import type { GameElapsed, Side } from '@domain/types';

const TEAM_ROWS: Side[] = [SIDES.AWAY, SIDES.HOME];

const laneRow = (side: Side, penaltyClock: PenaltyClock): number =>
   3 + TEAM_ROWS.indexOf(side) * 3 + penaltyClock;

function PenaltyChart() {
   const { game, penalties, penaltyResult, colors, teamByHomeOrAway, playerById } = useGame();
   const served = useMemo(
      () => penaltyResult.servedPenalties.filter(({ start, end }) => start < end),
      [penaltyResult],
   );
   const penaltyById = useMemo(
      () => new Map(penalties.map((play) => [play.eventId, play])),
      [penalties],
   );

   const moments = chartMoments(served);
   const line = (time: GameElapsed): number => moments.indexOf(time) + 2;
   const startsPeriod = (i: number): boolean =>
      i === 0 || momentPeriod(moments[i - 1]) !== momentPeriod(moments[i]);

   return (
      <div className="penalty-chart">
         <div
            className="penalty-chart__grid"
            style={{ '--intervals': Math.max(moments.length - 1, 1) } as CSSProperties}
         >
            {TEAM_ROWS.map((side) => (
               <div
                  key={side}
                  className="penalty-chart__team"
                  style={{ gridRow: `${laneRow(side, 0)} / span 2` }}
               >
                  {teamByHomeOrAway(side).abbrev}
               </div>
            ))}
            {TEAM_ROWS.flatMap((side) =>
               ([0, 1] as const).map((penaltyClock) => (
                  <div
                     key={`${side}-${penaltyClock}`}
                     className="penalty-chart__lane"
                     style={{ gridRow: laneRow(side, penaltyClock) }}
                  />
               )),
            )}

            {moments.map(
               (time, i) =>
                  startsPeriod(i)
                  && i > 0 && (
                     <div
                        key={`break-${time}`}
                        className="penalty-chart__period-break"
                        style={{ gridColumn: line(time) - 1 }}
                     />
                  ),
            )}
            {moments.map(
               (time, i) =>
                  startsPeriod(i) && (
                     <span
                        key={`period-${time}`}
                        className="penalty-chart__period"
                        style={{ gridColumn: line(time) }}
                     >
                        {periodLabel(momentPeriod(time), game.regPeriods)}
                     </span>
                  ),
            )}
            {moments.map((time) => (
               <time
                  key={`time-${time}`}
                  className="penalty-chart__time"
                  style={{ gridColumn: line(time) }}
               >
                  {momentClock(time)}
               </time>
            ))}

            {served.map((penalty) => {
               const play = penaltyById.get(penalty.penaltyEventId);
               if (!play) return null;
               const playerId = play.details.committedByPlayerId ?? play.details.servedByPlayerId;
               const player = playerId ? playerById(playerId) : undefined;
               const infraction = penaltyDisplayName(play.details.descKey);
               return (
                  <div
                     key={`${penalty.penaltyEventId}-${penalty.doubleMinorHalf ?? 0}`}
                     className={clsx(
                        'penalty-chart__box',
                        penalty.coincidental && 'penalty-chart__box--coincidental',
                        penalty.endReason === 'goal' && 'penalty-chart__box--goal',
                     )}
                     title={`${playerShortName(player)} · ${infraction} · ${play.details.duration} min`}
                     style={
                        {
                           'gridColumn': `${line(penalty.start)} / ${line(penalty.end)}`,
                           'gridRow': laneRow(penalty.side, penalty.penaltyClock),
                           '--team-color': colors[penalty.side],
                        } as CSSProperties
                     }
                  >
                     {player ? `#${player.sweaterNumber}` : infraction}
                  </div>
               );
            })}
         </div>
      </div>
   );
}

export default PenaltyChart;
