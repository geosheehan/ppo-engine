import type { ClockedPenalty } from '@engine/types';
import '@components/PenaltyClocks/PenaltyClocks.css';
import PenaltyCard from '@components/PenaltyCard';
import type { Side } from '@domain/types';

type PenaltyClocksProps = {
   side: Side;
   onClock?: ClockedPenalty[];
   position: 'left' | 'right';
};

const NO_PENALTIES: ClockedPenalty[] = [];

function PenaltyClocks({ side, onClock = NO_PENALTIES, position }: PenaltyClocksProps) {
   const clocks = ([0, 1] as const).map((penaltyClock) =>
      onClock.find(({ served }) => served.side === side && served.penaltyClock === penaltyClock),
   );

   return (
      <ol className={`penalty-clocks penalty-clocks--${position}`}>
         {clocks.map((clocked, penaltyClock) => (
            <li key={penaltyClock} className="penalty-clocks__slot">
               {clocked ? (
                  <PenaltyCard clocked={clocked} />
               ) : (
                  <div className="penalty-clocks__empty" />
               )}
            </li>
         ))}
      </ol>
   );
}

export default PenaltyClocks;
