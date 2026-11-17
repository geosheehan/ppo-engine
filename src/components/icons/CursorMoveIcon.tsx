import InlineIconFrame from '@components/icons/InlineIconFrame';
import type { InlineIconProps } from '@components/types';

type CursorMoveIconProps = InlineIconProps & {
   moves: 'cursor' | 'event';
   boxColor?: string;
};

function CursorMoveIcon({ moves, boxColor = 'currentColor', ...props }: CursorMoveIconProps) {
   return (
      <InlineIconFrame {...props}>
         <path
            d="M3 2v20"
            fill="none"
            strokeWidth={2.5}
            strokeLinecap="round"
            style={{ stroke: 'var(--goal-gold)' }}
         />
         <rect
            x={15.5}
            y={6}
            width={7}
            height={12}
            rx={2}
            strokeWidth={1.5}
            style={{ fill: `color-mix(in srgb, ${boxColor} 40%, transparent)`, stroke: boxColor }}
         />
         <path d={moves === 'cursor' ? 'M5.5 6l8 6-8 6z' : 'M13.5 6 5.5 12l8 6z'} />
      </InlineIconFrame>
   );
}

export default CursorMoveIcon;
