import '@components/PenaltyClocks.css';
import { useGame } from '@context/GameContext.tsx';
import { secondsToClock } from '@domain/clock.ts';
import type { PenaltyPlay } from '@domain/types.ts';
import { penaltyDisplayName } from '@domain/penalties.ts';
import { playerShortName } from '@domain/players.ts';
import type { ClockedPenalty, QueuedPenalty } from '@engine/snapshot.ts';
import type { Side } from '@engine/types.ts';

type PenaltyClocksProps = {
   side: Side;
   onClock: ClockedPenalty[];
   queued: QueuedPenalty[];
};

function PenaltyClocks({ side, onClock, queued }: PenaltyClocksProps) {
   const { teamByHomeOrAway, playerById } = useGame();
   const team = teamByHomeOrAway(side);

   const penaltyLabel = (play: PenaltyPlay): string => {
      const playerId = play.details.committedByPlayerId ?? play.details.servedByPlayerId;
      const player = playerId ? playerById(playerId) : undefined;
      return `${playerShortName(player)} | ${penaltyDisplayName(play.details.descKey)}`;
   };

   const clocks = ([0, 1] as const).map((penaltyClock) =>
      onClock.find(({ served }) => served.side === side && served.penaltyClock === penaltyClock));
   const waiting = queued.filter(({ served }) => served.side === side);

   return (
      <div className="penalty-clocks">
         <h3 className="penalty-clocks__team">{team.abbrev}</h3>
         <ol className="penalty-clocks__list">
            {clocks.map((clocked, penaltyClock) => (
               <li key={penaltyClock} className="penalty-clocks__clock">
                  {clocked ? (
                     <>
                        <span className="penalty-clocks__time">{secondsToClock(clocked.remaining)}</span>
                        <span className="penalty-clocks__who">{penaltyLabel(clocked.play)}</span>
                     </>
                  ) : (
                     <span className="penalty-clocks__empty">–</span>
                  )}
               </li>
            ))}
         </ol>
         {waiting.length > 0 && (
            <ul className="penalty-clocks__queue">
               {waiting.map(({ served, play }) => (
                  <li key={`${served.penaltyEventId}-${served.doubleMinorHalf ?? 0}`}>Waiting: {penaltyLabel(play)}</li>
               ))}
            </ul>
         )}
      </div>
   );
};

export default PenaltyClocks;
