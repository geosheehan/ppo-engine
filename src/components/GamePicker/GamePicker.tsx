import '@components/GamePicker/GamePicker.css';
import { useEffect, useId, useRef, useState } from 'react';
import GameWeek from '@components/GameWeek';
import type { GameSummary } from '@api/types';

type GamePickerProps = {
   selected?: GameSummary;
   autoOpen: boolean;
   onPick: (id: string) => void;
};

function GamePicker({ selected, autoOpen, onPick }: GamePickerProps) {
   const popoverId = useId();
   const popoverRef = useRef<HTMLDivElement>(null);
   const [open, setOpen] = useState(false);

   useEffect(() => {
      const popover = popoverRef.current;
      if (autoOpen && popover !== null && !popover.matches(':popover-open')) popover.showPopover();
   }, [autoOpen]);

   const pick = (id: string) => {
      popoverRef.current?.hidePopover();
      onPick(id);
   };

   return (
      <>
         <button type="button" className="game-picker__trigger" popoverTarget={popoverId}>
            Game
            {selected !== undefined && (
               <span className="game-picker__current">
                  {' · '}
                  {selected.away} @ {selected.home}
               </span>
            )}
            <span aria-hidden="true">▾</span>
         </button>
         <div
            ref={popoverRef}
            id={popoverId}
            popover="auto"
            role="dialog"
            aria-label="Pick a game"
            className="game-picker"
            onToggle={(event) => {
               if (event.target === event.currentTarget) setOpen(event.newState === 'open');
            }}
         >
            {open && (
               <GameWeek initialDate={selected?.date} selectedId={selected?.id} onPick={pick} />
            )}
         </div>
      </>
   );
}

export default GamePicker;
