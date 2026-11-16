import InlineIconFrame from '@components/icons/InlineIconFrame';
import type { InlineIconProps } from '@components/types';

function MinusIcon(props: InlineIconProps) {
   return (
      <InlineIconFrame {...props}>
         <path d="M5 11h14v2H5z" />
      </InlineIconFrame>
   );
}

export default MinusIcon;
