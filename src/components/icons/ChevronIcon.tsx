import InlineIconFrame from '@components/icons/InlineIconFrame';
import type { InlineIconProps } from '@components/types';

type ChevronIconProps = InlineIconProps & {
   direction: 'left' | 'right';
};

function ChevronIcon({ direction, ...props }: ChevronIconProps) {
   return (
      <InlineIconFrame {...props}>
         <path
            d={
               direction === 'left'
                  ? 'M15.4 7.4 14 6l-6 6 6 6 1.4-1.4-4.6-4.6z'
                  : 'M8.6 7.4 10 6l6 6-6 6-1.4-1.4 4.6-4.6z'
            }
         />
      </InlineIconFrame>
   );
}

export default ChevronIcon;
