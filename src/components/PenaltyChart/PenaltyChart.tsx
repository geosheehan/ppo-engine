import '@components/PenaltyChart/PenaltyChart.css';
import { useMemo } from 'react';
import { clsx } from 'clsx';
import { useGame } from '@context/useGame';
import { axisX, isBaseline } from '@layout/gameAxis';
import type { GameAxis, StrengthPiece } from '@layout/gameAxis';
import { chartMoments, labelRows, momentClock, momentPeriod } from '@layout/penaltyChart';
import { strengthLabel } from '@engine/strength';
import type { PenaltyClock } from '@engine/types';
import { PERIOD_TYPES, SIDES } from '@domain/constants';
import { periodLabel } from '@domain/labels';
import { penaltyDisplayName } from '@domain/penalties';
import { playerShortName } from '@domain/players';
import { isGoal, playTime } from '@domain/plays';
import type { GameElapsed, Side } from '@domain/types';

const TEAM_ROWS: Side[] = [SIDES.AWAY, SIDES.HOME];
// Fraction of the chart a time label needs at the strip's narrowest width.
const LABEL_GAP = 0.05;

const advantageSide = ({ strength }: StrengthPiece): Side | undefined => {
   if (strength.away === strength.home) return undefined;
   return strength.away > strength.home ? SIDES.AWAY : SIDES.HOME;
};

type PenaltyChartProps = {
   axis: GameAxis;
};

function PenaltyChart({ axis }: PenaltyChartProps) {
   const { game, plays, penalties, penaltyResult, colors, teamByHomeOrAway, playerById, sideOf } =
      useGame();
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
   const goals = useMemo(
      () =>
         plays
            .filter(isGoal)
            .filter((play) => play.periodDescriptor.periodType !== PERIOD_TYPES.SHOOTOUT)
            .map((play) => ({
               eventId: play.eventId,
               time: playTime(play),
               side: sideOf(play.details.eventOwnerTeamId),
            }))
            .filter(({ time }) => time <= gameEnd),
      [plays, sideOf, gameEnd],
   );

   const moments = chartMoments(axis.breakpoints, [
      ...served.flatMap(({ start, end }) => [start, end]),
      ...goals.map(({ time }) => time),
   ]);
   const labelRowOf = labelRows(
      [
         ...served.map(({ start, end }): [GameElapsed, GameElapsed] => [
            start,
            Math.min(end, gameEnd),
         ]),
         ...goals.map(({ time }): [GameElapsed, GameElapsed] => [time, time]),
      ],
      (time) => axisX(axis, time),
      LABEL_GAP,
   );
   const labelTimes = [...labelRowOf.keys()];
   const labelRowCount = Math.max(1, ...[...labelRowOf.values()].map((row) => row + 1));

   const labelRow = (time: GameElapsed): number => 2 + (labelRowOf.get(time) ?? 0);
   const firstLane = 2 + labelRowCount;
   const laneRow = (side: Side, penaltyClock: PenaltyClock): number =>
      firstLane + TEAM_ROWS.indexOf(side) * 3 + penaltyClock;
   const strengthRow = firstLane + 2;
   const goalsRow = firstLane + 5;

   const line = (time: GameElapsed): number => moments.indexOf(Math.min(time, gameEnd)) + 2;
   const columns = moments
      .slice(1)
      .map((time, i) => `minmax(0, ${axisX(axis, time) - axisX(axis, moments[i])}fr)`);
   const shootoutColumn = axis.shootout && `minmax(0, ${1 - axisX(axis, gameEnd)}fr)`;
   const shootoutLine = moments.length + 1;
   const away = teamByHomeOrAway(SIDES.AWAY).abbrev;
   const home = teamByHomeOrAway(SIDES.HOME).abbrev;
   const momentTitle = (time: GameElapsed): string =>
      `${periodLabel(momentPeriod(time), game.regPeriods)} ${momentClock(time)}`;

   return (
      <div className="penalty-chart">
         <div
            className="penalty-chart__grid"
            style={{
               gridTemplateColumns: ['4rem', ...columns, shootoutColumn, '0'].join(' '),
               gridTemplateRows: `1.25rem repeat(${labelRowCount}, 1.25rem) repeat(5, 1.75rem) 1.75rem`,
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
            <div className="penalty-chart__team" style={{ gridRow: strengthRow }}>
               Strength
            </div>
            <div className="penalty-chart__team" style={{ gridRow: goalsRow }}>
               Goals
            </div>
            {TEAM_ROWS.flatMap((side) =>
               ([0, 1] as const).map((penaltyClock) => (
                  <div
                     key={`${side}-${penaltyClock}`}
                     className="penalty-chart__lane"
                     style={{ gridRow: laneRow(side, penaltyClock) }}
                  />
               )),
            )}
            <div className="penalty-chart__goal-lane" style={{ gridRow: goalsRow }} />

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
            {labelTimes.map((time) => {
               const goal = goals.find((candidate) => candidate.time === time);
               return (
                  <time
                     key={`time-${time}`}
                     className={clsx('penalty-chart__time', goal && 'penalty-chart__time--goal')}
                     style={{
                        'gridColumn': line(time),
                        'gridRow': labelRow(time),
                        '--team-color': goal && colors[goal.side],
                     }}
                  >
                     {momentClock(time)}
                  </time>
               );
            })}

            {axis.pieces.map((piece) => {
               const side = advantageSide(piece);
               const baseline = isBaseline(piece);
               return (
                  <div
                     key={`strength-${piece.start}`}
                     className={clsx(
                        'penalty-chart__strength',
                        baseline && 'penalty-chart__strength--baseline',
                        !baseline && side === undefined && 'penalty-chart__strength--even',
                     )}
                     title={`${momentTitle(piece.start)}–${momentClock(piece.end)} · ${away} ${piece.strength.away} – ${home} ${piece.strength.home}`}
                     style={{
                        'gridColumn': `${line(piece.start)} / ${line(piece.end)}`,
                        'gridRow': strengthRow,
                        '--team-color': side !== undefined ? colors[side] : undefined,
                     }}
                  >
                     {!baseline && strengthLabel(piece.strength, side ?? SIDES.AWAY)}
                  </div>
               );
            })}

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

            {goals.map(({ eventId, time, side }) => (
               <div
                  key={`goal-line-${eventId}`}
                  className="penalty-chart__goal-line"
                  style={{
                     'gridColumn': line(time),
                     'gridRow': `${labelRow(time) + 1} / ${goalsRow + 1}`,
                     '--team-color': colors[side],
                  }}
               />
            ))}
            {goals.map(({ eventId, time, side }) => (
               <span
                  key={`goal-${eventId}`}
                  className="penalty-chart__goal"
                  title={`${teamByHomeOrAway(side).abbrev} goal · ${momentTitle(time)}`}
                  style={{
                     'gridColumn': line(time),
                     'gridRow': goalsRow,
                     '--team-color': colors[side],
                  }}
               />
            ))}
         </div>
      </div>
   );
}

export default PenaltyChart;
