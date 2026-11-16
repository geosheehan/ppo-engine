import '@components/ActionButton/ActionButton.css';

type ActionButtonProps = {
   label: string;
   name?: string;
   blocked?: string;
   hint?: string;
   pressed?: boolean;
   onClick: () => void;
   onBlocked?: (reason: string) => void;
};

function ActionButton({
   label,
   name,
   blocked,
   hint,
   pressed,
   onClick,
   onBlocked,
}: ActionButtonProps) {
   return (
      <button
         type="button"
         className="action-button"
         aria-label={name}
         aria-disabled={blocked !== undefined}
         aria-pressed={pressed}
         title={blocked ?? hint}
         onClick={() => {
            if (blocked === undefined) onClick();
            else onBlocked?.(blocked);
         }}
      >
         {label}
      </button>
   );
}

export default ActionButton;
