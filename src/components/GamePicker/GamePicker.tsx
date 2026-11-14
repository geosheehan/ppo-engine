import '@components/GamePicker/GamePicker.css';
import { useEffect, useId, useRef, useState } from 'react';
import GameWeek from '@components/GameWeek';
import CloseIcon from '@components/icons/nav/CloseIcon';
import type { GameSummary } from '@api/types';

type GamePickerProps = {
   selected?: GameSummary;
   autoOpen: boolean;
   onPick: (id: string) => void;
};

function GamePicker({ selected, autoOpen, onPick }: GamePickerProps) {
   const popoverId = useId();
   const popoverRef = useRef<HTMLDivElement>(null);
   const triggerRef = useRef<HTMLButtonElement>(null);
   const [open, setOpen] = useState(false);

   useEffect(() => {
      const popover = popoverRef.current;
      if (autoOpen && popover !== null && !popover.matches(':popover-open')) popover.showPopover();
   }, [autoOpen]);

   const pick = (id: string) => {
      popoverRef.current?.hidePopover();
      triggerRef.current?.focus();
      onPick(id);
   };

   return (
      <>
         <button
            ref={triggerRef}
            type="button"
            className="game-picker__trigger"
            popoverTarget={popoverId}
         >
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
            <div className="game-picker__head">
               <h2 className="game-picker__title">Pick a game</h2>
               <button
                  type="button"
                  className="game-picker__close"
                  aria-label="Close"
                  title="Close"
                  popoverTarget={popoverId}
                  popoverTargetAction="hide"
               >
                  <CloseIcon size={20} />
               </button>
            </div>
            {open && (
               <GameWeek initialDate={selected?.date} selectedId={selected?.id} onPick={pick} />
            )}
         </div>
      </>
   );
}

export default GamePicker;
