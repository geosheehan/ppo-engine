import InlineIconFrame from '@components/icons/InlineIconFrame';
import type { InlineIconProps } from '@components/types';

function NextIcon(props: InlineIconProps) {
   return (
      <InlineIconFrame {...props}>
         <path d="M8 6v12l8.5-6z" />
      </InlineIconFrame>
   );
}

export default NextIcon;
