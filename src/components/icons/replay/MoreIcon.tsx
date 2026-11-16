import InlineIconFrame from '@components/icons/InlineIconFrame';
import type { InlineIconProps } from '@components/types';

function MoreIcon(props: InlineIconProps) {
   return (
      <InlineIconFrame {...props}>
         <circle cx="5" cy="12" r="2" />
         <circle cx="12" cy="12" r="2" />
         <circle cx="19" cy="12" r="2" />
      </InlineIconFrame>
   );
}

export default MoreIcon;
