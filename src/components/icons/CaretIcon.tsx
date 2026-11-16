import InlineIconFrame from '@components/icons/InlineIconFrame';
import type { InlineIconProps } from '@components/types';

type CaretIconProps = InlineIconProps & {
   direction?: 'up' | 'down';
};

function CaretIcon({ direction = 'down', ...props }: CaretIconProps) {
   return (
      <InlineIconFrame {...props}>
         <path d={direction === 'down' ? 'M7 10h10l-5 6z' : 'M7 14h10l-5-6z'} />
      </InlineIconFrame>
   );
}

export default CaretIcon;
