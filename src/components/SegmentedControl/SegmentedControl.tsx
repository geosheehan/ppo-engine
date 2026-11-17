import '@components/SegmentedControl/SegmentedControl.css';
import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { textColorOn } from '@domain/colors';

export type SegmentedOption<T extends string> = {
   value: T;
   label: ReactNode;
   color?: string;
};

type SegmentedControlProps<T extends string> = {
   label: string;
   value: T;
   options: SegmentedOption<T>[];
   className?: string;
   onChange: (value: T) => void;
};

function SegmentedControl<T extends string>({
   label,
   value,
   options,
   className,
   onChange,
}: SegmentedControlProps<T>) {
   return (
      <span role="group" aria-label={label} className={clsx('segmented-control', className)}>
         {options.map((option) => (
            <button
               key={option.value}
               type="button"
               className={clsx(option.color !== undefined && 'segmented-control__option--colored')}
               aria-pressed={option.value === value}
               style={
                  option.color !== undefined
                     ? {
                          '--team-color': option.color,
                          '--team-text-color': textColorOn(option.color),
                       }
                     : undefined
               }
               onClick={() => onChange(option.value)}
            >
               {option.label}
            </button>
         ))}
      </span>
   );
}

export default SegmentedControl;
