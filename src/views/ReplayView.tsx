import '@views/ReplayView.css';
import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useGame } from '@context/GameContext.tsx';
import { matchupColors } from '@domain/colors.ts';
import { TEAM_COLORS } from '@domain/teamColors.ts';
import { isGoal, isPenalty } from '@domain/types.ts';
import type { Team } from '@domain/types.ts';
import { homeDefendingSides } from '@engine/defendingSide.ts';
import { byGameOrder, playTime, runPenaltyEngine } from '@engine/penaltyEngine.ts';
import { snapshotAt } from '@engine/snapshot.ts';
import { opportunityTotals } from '@engine/opportunities.ts';
import type { Side } from '@engine/types.ts';
import CurrentPlay from '@components/CurrentPlay.tsx';
import PenaltyClocks from '@components/PenaltyClocks.tsx';
import PlayMarker from '@components/PlayMarker.tsx';
import ReplayControls from '@components/ReplayControls.tsx';
import Rink from '@components/Rink.tsx';
import Scoreboard from '@components/Scoreboard.tsx';
import StrengthTable from '@components/StrengthTable.tsx';

const teamFullName = (team: Team): string => `${team.placeName.default} ${team.commonName.default}`.toUpperCase();

const teamColors = (team: Team): string[] => TEAM_COLORS[team.abbrev] ?? ['#6b6b6b'];

function ReplayView() {
   const { game } = useGame();

   // Computed once per game. Nothing here changes while stepping through plays.
   const plays = useMemo(() => game.plays.toSorted(byGameOrder), [game]);
   const result = useMemo(() => runPenaltyEngine(game), [game]);
   const penaltyPlays = useMemo(() => new Map(plays.filter(isPenalty).map((play) => [play.eventId, play])), [plays]);
   const goalPlays = useMemo(() => new Map(plays.filter(isGoal).map((play) => [play.eventId, play])), [plays]);
   const defendingSides = useMemo(() => homeDefendingSides(game), [game]);
   const colors = useMemo(() => matchupColors(teamColors(game.homeTeam), teamColors(game.awayTeam)), [game]);

   // The only replay state: which play we're on. Everything below is derived from it.
   const [index, setIndex] = useState(0);
   const play = plays[index];
   const time = playTime(play);
   const snapshot = snapshotAt(result, penaltyPlays, time);
   const totals = opportunityTotals(result, goalPlays, time);

   const lastGoal = plays.slice(0, index + 1).findLast(isGoal);
   const score = { away: lastGoal?.details.awayScore ?? 0, home: lastGoal?.details.homeScore ?? 0 };

   const homeOnLeft = defendingSides.get(play.periodDescriptor.number) === 'left';
   const leftColor = homeOnLeft ? colors.home : colors.away;
   const rightColor = homeOnLeft ? colors.away : colors.home;
   const endColors = { '--left-end-color': leftColor, '--right-end-color': rightColor } as CSSProperties;
   const sides: Side[] = homeOnLeft ? ['home', 'away'] : ['away', 'home'];
   const teamColor = (teamId: number): string => (teamId === game.homeTeam.id ? colors.home : colors.away);

   return (
      <section className="replay" style={endColors}>
         <span className="replay__title">{teamFullName(game.awayTeam)} @ {teamFullName(game.homeTeam)}</span>
         <Scoreboard score={score} homeOnLeft={homeOnLeft} />
         <CurrentPlay play={play} />
         <Rink className="replay__rink">
            <PlayMarker play={play} teamColor={teamColor} className="replay__icon" />
         </Rink>
         <div className="replay__clocks">
            {sides.map((side) => (
               <PenaltyClocks key={side} side={side} onClock={snapshot.onClock} queued={snapshot.queued} />
            ))}
         </div>
         <ReplayControls index={index} count={plays.length} onChange={setIndex} />
         <div className="replay__clocks">
            {sides.map((side) => (
               <StrengthTable key={side} side={side} totals={totals[side]} />
            ))}
         </div>
      </section>
   );
};

export default ReplayView;
