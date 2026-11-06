import '@components/StrengthRibbon/StrengthRibbon.css';
import { clsx } from 'clsx';
import { useGame } from '@context/useGame';
import { axisX, isBaseline } from '@layout/gameAxis';
import type { GameAxis, StrengthPiece } from '@layout/gameAxis';
import { secondsToClock } from '@domain/clock';
import { PERIOD_SECONDS, PERIOD_TYPES, SIDES } from '@domain/constants';
import { periodLabel } from '@domain/labels';
import { isGoal, playTime } from '@domain/plays';
import type { GameElapsed } from '@domain/types';

// Pixels per skater of difference. The away team's bars rise above the center line, the home team's hang below.
const UNIT = 14;
const CENTER = 34;
const GOALS_Y = 84;
const HEIGHT = 96;
const SHOOTOUT_ROUNDS = 3;

const percent = (fraction: number): string => `${fraction * 100}%`;

type StrengthRibbonProps = {
   axis: GameAxis;
};

function StrengthRibbon({ axis }: StrengthRibbonProps) {
   const { game, plays, colors, teamByHomeOrAway, sideOf } = useGame();
   const x = (time: GameElapsed): number => axisX(axis, time);
   const timedEnd = x(axis.breakpoints.at(-1) ?? 0);
   const away = teamByHomeOrAway(SIDES.AWAY).abbrev;
   const home = teamByHomeOrAway(SIDES.HOME).abbrev;
   const clock = (period: number, time: GameElapsed): string =>
      secondsToClock(time - (period - 1) * PERIOD_SECONDS);
   const goals = plays
      .filter(isGoal)
      .filter((play) => play.periodDescriptor.periodType !== PERIOD_TYPES.SHOOTOUT);
   const shootout = axis.shootout;

   const pieceShapes = (piece: StrengthPiece) => {
      const { away: awaySkaters, home: homeSkaters } = piece.strength;
      const left = percent(x(piece.start));
      const width = percent(x(piece.end) - x(piece.start));
      const title = `${periodLabel(piece.period, game.regPeriods)} ${clock(piece.period, piece.start)}–${clock(piece.period, piece.end)} · ${away} ${awaySkaters} – ${home} ${homeSkaters}`;

      if (isBaseline(piece)) {
         return (
            <rect
               className={clsx(
                  'strength-ribbon__baseline',
                  piece.period > game.regPeriods && 'strength-ribbon__baseline--overtime',
               )}
               x={left}
               width={width}
               y={CENTER - 3}
               height={6}
            >
               <title>{title}</title>
            </rect>
         );
      }
      if (awaySkaters === homeSkaters) {
         const size = Math.abs(awaySkaters - piece.baseline) * UNIT;
         return (
            <g className="strength-ribbon__even">
               <title>{title}</title>
               <rect x={left} width={width} y={CENTER - size} height={size} fill={colors.away} />
               <rect x={left} width={width} y={CENTER} height={size} fill={colors.home} />
            </g>
         );
      }
      const size = Math.abs(awaySkaters - homeSkaters) * UNIT;
      const awayLeads = awaySkaters > homeSkaters;
      return (
         <rect
            x={left}
            width={width}
            y={awayLeads ? CENTER - size : CENTER}
            height={size}
            fill={awayLeads ? colors.away : colors.home}
         >
            <title>{title}</title>
         </rect>
      );
   };

   return (
      <div className="strength-ribbon">
         <div className="strength-ribbon__labels" style={{ height: HEIGHT }}>
            <span style={{ top: CENTER - UNIT }}>{away} ↑</span>
            <span style={{ top: CENTER + UNIT }}>{home} ↓</span>
            <span style={{ top: GOALS_Y }}>Goals</span>
         </div>
         <svg
            className="strength-ribbon__chart"
            height={HEIGHT}
            role="img"
            aria-label={`Skater strength and goals, ${away} at ${home}`}
         >
            {axis.periods.slice(1).map(({ period, start }) => (
               <line
                  key={period}
                  className="strength-ribbon__break"
                  x1={percent(x(start))}
                  x2={percent(x(start))}
                  y1={0}
                  y2={HEIGHT}
               />
            ))}
            <line
               className="strength-ribbon__axis"
               x1={0}
               x2={percent(timedEnd)}
               y1={CENTER}
               y2={CENTER}
            />
            <line
               className="strength-ribbon__axis"
               x1={0}
               x2={percent(timedEnd)}
               y1={GOALS_Y}
               y2={GOALS_Y}
            />

            {axis.pieces.map((piece) => (
               <g key={piece.start} shapeRendering="crispEdges">
                  {pieceShapes(piece)}
               </g>
            ))}

            {goals.map((goal) => {
               const time = playTime(goal);
               const side = sideOf(goal.details.eventOwnerTeamId);
               return (
                  <circle
                     key={goal.eventId}
                     className="strength-ribbon__goal"
                     cx={percent(x(time))}
                     cy={GOALS_Y}
                     r={5}
                     fill={colors[side]}
                  >
                     <title>
                        {`${teamByHomeOrAway(side).abbrev} goal · ${periodLabel(goal.periodDescriptor.number, game.regPeriods)} ${goal.timeInPeriod}`}
                     </title>
                  </circle>
               );
            })}

            {shootout && (
               <g>
                  <line
                     className="strength-ribbon__break"
                     x1={percent((timedEnd + shootout.start) / 2)}
                     x2={percent((timedEnd + shootout.start) / 2)}
                     y1={0}
                     y2={HEIGHT}
                  />
                  {[CENTER, GOALS_Y].map((y) => (
                     <line
                        key={y}
                        className="strength-ribbon__axis"
                        x1={percent(shootout.start)}
                        x2="100%"
                        y1={y}
                        y2={y}
                     />
                  ))}
                  {Array.from({ length: Math.ceil(shootout.attempts.length / 2) - 1 }, (_, i) => {
                     const round = i + 1;
                     const at = percent(shootout.start + round * 2 * shootout.attemptWidth);
                     const suddenDeath = round === SHOOTOUT_ROUNDS;
                     return (
                        <line
                           key={round}
                           className={clsx(
                              'strength-ribbon__round',
                              suddenDeath && 'strength-ribbon__round--sudden-death',
                           )}
                           x1={at}
                           x2={at}
                           y1={suddenDeath ? 0 : CENTER - 6}
                           y2={suddenDeath ? HEIGHT : CENTER + 6}
                        />
                     );
                  })}
                  {shootout.attempts.map(
                     ({ side, goal }, i) =>
                        goal && (
                           <circle
                              key={i}
                              className="strength-ribbon__goal"
                              cx={percent(shootout.start + (i + 0.5) * shootout.attemptWidth)}
                              cy={GOALS_Y}
                              r={5}
                              fill={colors[side]}
                           >
                              <title>{`${teamByHomeOrAway(side).abbrev} shootout goal · round ${Math.floor(i / 2) + 1}`}</title>
                           </circle>
                        ),
                  )}
               </g>
            )}
         </svg>
      </div>
   );
}

export default StrengthRibbon;
