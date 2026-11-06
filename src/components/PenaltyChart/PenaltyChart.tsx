import '@components/PenaltyChart/PenaltyChart.css';
import { useMemo } from 'react';
import { clsx } from 'clsx';
import { useGame } from '@context/useGame';
import { axisX } from '@layout/gameAxis';
import type { GameAxis } from '@layout/gameAxis';
import { chartMoments, momentClock } from '@layout/penaltyChart';
import type { PenaltyClock } from '@engine/types';
import { PERIOD_TYPES, SIDES } from '@domain/constants';
import { periodLabel } from '@domain/labels';
import { penaltyDisplayName } from '@domain/penalties';
import { playerShortName } from '@domain/players';
import type { GameElapsed, Side } from '@domain/types';

const TEAM_ROWS: Side[] = [SIDES.AWAY, SIDES.HOME];

const laneRow = (side: Side, penaltyClock: PenaltyClock): number =>
   3 + TEAM_ROWS.indexOf(side) * 3 + penaltyClock;

type PenaltyChartProps = {
   axis: GameAxis;
};

function PenaltyChart({ axis }: PenaltyChartProps) {
   const { game, penalties, penaltyResult, colors, teamByHomeOrAway, playerById } = useGame();
   const gameEnd = axis.breakpoints.at(-1) ?? 0;
   const served = useMemo(
      () =>
         penaltyResult.servedPenalties.filter(({ start, end }) => start < end && start < gameEnd),
      [penaltyResult, gameEnd],
   );
   const penaltyById = useMemo(
      () => new Map(penalties.map((play) => [play.eventId, play])),
      [penalties],
   );

   const moments = chartMoments(served, axis.breakpoints);
   const penaltyMoments = new Set(served.flatMap(({ start, end }) => [start, end]));
   const line = (time: GameElapsed): number => moments.indexOf(Math.min(time, gameEnd)) + 2;
   const columns = moments
      .slice(1)
      .map((time, i) => `minmax(0, ${axisX(axis, time) - axisX(axis, moments[i])}fr)`);
   const shootoutColumn = axis.shootout && `minmax(0, ${1 - axisX(axis, gameEnd)}fr)`;
   const shootoutLine = moments.length + 1;

   return (
      <div className="penalty-chart">
         <div
            className="penalty-chart__grid"
            style={{
               gridTemplateColumns: ['4rem', ...columns, shootoutColumn, '0'].join(' '),
            }}
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

            {axis.periods.slice(1).map(({ period, start }) => (
               <div
                  key={`break-${period}`}
                  className="penalty-chart__period-break"
                  style={{ gridColumn: line(start) }}
               />
            ))}
            {axis.periods.map(({ period, start }) => (
               <span
                  key={`period-${period}`}
                  className="penalty-chart__period"
                  style={{ gridColumn: line(start) }}
               >
                  {periodLabel(period, game.regPeriods)}
               </span>
            ))}
            {axis.shootout && (
               <>
                  <div
                     className="penalty-chart__period-break"
                     style={{ gridColumn: shootoutLine }}
                  />
                  <span className="penalty-chart__period" style={{ gridColumn: shootoutLine }}>
                     {PERIOD_TYPES.SHOOTOUT}
                  </span>
               </>
            )}
            {moments
               .filter((time) => penaltyMoments.has(time))
               .map((time) => (
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
               const player = playerId !== undefined ? playerById(playerId) : undefined;
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
                     style={{
                        'gridColumn': `${line(penalty.start)} / ${line(penalty.end)}`,
                        'gridRow': laneRow(penalty.side, penalty.penaltyClock),
                        '--team-color': colors[penalty.side],
                     }}
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
