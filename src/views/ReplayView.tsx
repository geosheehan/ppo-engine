import '@views/ReplayView.css';
import { useMemo, useState } from 'react';
import { useGame } from '@context/GameContext.tsx';
import { isGoal, isPenalty } from '@domain/types.ts';
import type { Team } from '@domain/types.ts';
import { byGameOrder, playTime, runPenaltyEngine } from '@engine/penaltyEngine.ts';
import { snapshotAt } from '@engine/snapshot.ts';
import { opportunityTotals } from '@engine/opportunities.ts';
import CurrentPlay from '@components/CurrentPlay.tsx';
import PenaltyClocks from '@components/PenaltyClocks.tsx';
import ReplayControls from '@components/ReplayControls.tsx';
import Rink from '@components/Rink.tsx';
import Scoreboard from '@components/Scoreboard.tsx';
import StrengthTable from '@components/StrengthTable.tsx';
import BlockedShotIcon from '@components/event-icons/BlockedShotIcon.tsx';
import DelayedPenaltyIcon from '@components/event-icons/DelayedPenaltyIcon.tsx';
import FaceoffIcon from '@components/event-icons/FaceoffIcon.tsx';
import GiveawayIcon from '@components/event-icons/GiveawayIcon.tsx';
import HitIcon from '@components/event-icons/HitIcon.tsx';
import MissedShotIcon from '@components/event-icons/MissedShotIcon.tsx';
import PenaltyIcon from '@components/event-icons/PenaltyIcon.tsx';
import ShotOnGoalIcon from '@components/event-icons/ShotOnGoalIcon.tsx';
import StoppageIcon from '@components/event-icons/StoppageIcon.tsx';
import TakeawayIcon from '@components/event-icons/TakeawayIcon.tsx';

// One of each event icon, spaced 16 ft apart across the ice.
const ICON_SAMPLES = [
   ShotOnGoalIcon, MissedShotIcon, BlockedShotIcon, HitIcon, GiveawayIcon,
   TakeawayIcon, FaceoffIcon, PenaltyIcon, DelayedPenaltyIcon, StoppageIcon,
];

const teamFullName = (team: Team): string => `${team.placeName.default} ${team.commonName.default}`.toUpperCase();

function ReplayView() {
   const { game } = useGame();

   // Computed once per game. Nothing here changes while stepping through plays.
   const plays = useMemo(() => game.plays.toSorted(byGameOrder), [game]);
   const result = useMemo(() => runPenaltyEngine(game), [game]);
   const penaltyPlays = useMemo(() => new Map(plays.filter(isPenalty).map((play) => [play.eventId, play])), [plays]);
   const goalPlays = useMemo(() => new Map(plays.filter(isGoal).map((play) => [play.eventId, play])), [plays]);

   // The only replay state: which play we're on. Everything below is derived from it.
   const [index, setIndex] = useState(0);
   const play = plays[index];
   const time = playTime(play);
   const snapshot = snapshotAt(result, penaltyPlays, time);
   const totals = opportunityTotals(result, goalPlays, time);

   const lastGoal = plays.slice(0, index + 1).findLast(isGoal);
   const score = { away: lastGoal?.details.awayScore ?? 0, home: lastGoal?.details.homeScore ?? 0 };
   const goalEffect = result.goals.find((goal) => goal.goalEventId === play.eventId);

   return (
      <section className="replay">
         <span className="replay__title">{teamFullName(game.awayTeam)} @ {teamFullName(game.homeTeam)}</span>
         <Scoreboard score={score} />
         <CurrentPlay play={play} goalEffect={goalEffect} />
         <Rink className="replay__rink">
            {ICON_SAMPLES.map((Icon, i) => (
               <Icon key={i} className="replay__icon" x={-72 + i * 16} y={0} size={4} />
            ))}
         </Rink>
         <div className="replay__clocks">
            <PenaltyClocks side="away" onClock={snapshot.onClock} queued={snapshot.queued} />
            <PenaltyClocks side="home" onClock={snapshot.onClock} queued={snapshot.queued} />
         </div>
         <ReplayControls index={index} count={plays.length} onChange={setIndex} />
         <div className="replay__clocks">
            <StrengthTable side="away" totals={totals.away} />
            <StrengthTable side="home" totals={totals.home} />
         </div>
      </section>
   );
};

export default ReplayView;
