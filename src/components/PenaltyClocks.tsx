import '@components/PenaltyClocks.css';
import type { ClockedPenalty } from '@engine/snapshot';
import type { Side } from '@domain/types';
import PenaltyCard from '@components/PenaltyCard';

type PenaltyClocksProps = {
   side: Side;
   onClock: ClockedPenalty[];
   position: 'left' | 'right';
};

function PenaltyClocks({ side, onClock, position }: PenaltyClocksProps) {
   const clocks = ([0, 1] as const).map((penaltyClock) =>
      onClock.find(({ served }) => served.side === side && served.penaltyClock === penaltyClock));

   return (
      <ol className={`penalty-clocks penalty-clocks--${position}`}>
         {clocks.map((clocked, penaltyClock) => (
            <li key={penaltyClock} className="penalty-clocks__slot">
               {clocked ? <PenaltyCard clocked={clocked} /> : <div className="penalty-clocks__empty" />}
            </li>
         ))}
      </ol>
   );
};

export default PenaltyClocks;
