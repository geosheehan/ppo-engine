import '@components/ActionButton/ActionButton.css';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { clsx } from 'clsx';

const REPEAT_DELAY_MS = 400;
const REPEAT_EVERY_MS = 80;

type ActionButtonProps = {
   label: ReactNode;
   name?: string;
   blocked?: string;
   hint?: string;
   pressed?: boolean;
   repeat?: boolean;
   onClick: () => void;
   onBlocked?: (reason: string) => void;
};

function ActionButton({
   label,
   name,
   blocked,
   hint,
   pressed,
   repeat = false,
   onClick,
   onBlocked,
}: ActionButtonProps) {
   const timerRef = useRef<number>(undefined);
   const repeatedRef = useRef(false);
   const latestRef = useRef({ onClick, blocked });
   useEffect(() => {
      latestRef.current = { onClick, blocked };
   });

   const stopRepeat = () => {
      clearTimeout(timerRef.current);
      clearInterval(timerRef.current);
      timerRef.current = undefined;
   };
   useEffect(() => stopRepeat, []);

   const startRepeat = () => {
      repeatedRef.current = false;
      timerRef.current = window.setTimeout(() => {
         timerRef.current = window.setInterval(() => {
            if (latestRef.current.blocked !== undefined) return stopRepeat();
            repeatedRef.current = true;
            latestRef.current.onClick();
         }, REPEAT_EVERY_MS);
      }, REPEAT_DELAY_MS);
   };

   return (
      <button
         type="button"
         className={clsx('action-button', repeat && 'action-button--repeat')}
         aria-label={name}
         aria-disabled={blocked !== undefined}
         aria-pressed={pressed}
         title={blocked ?? hint}
         onPointerDown={(e) => {
            if (repeat && e.button === 0) startRepeat();
         }}
         onPointerUp={repeat ? stopRepeat : undefined}
         onPointerLeave={repeat ? stopRepeat : undefined}
         onPointerCancel={repeat ? stopRepeat : undefined}
         onClick={() => {
            if (repeatedRef.current) {
               repeatedRef.current = false;
               return;
            }
            if (blocked === undefined) onClick();
            else onBlocked?.(blocked);
         }}
      >
         {label}
      </button>
   );
}

export default ActionButton;
