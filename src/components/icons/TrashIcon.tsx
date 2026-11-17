import InlineIconFrame from '@components/icons/InlineIconFrame';
import type { InlineIconProps } from '@components/types';

function TrashIcon(props: InlineIconProps) {
   return (
      <InlineIconFrame {...props}>
         <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
      </InlineIconFrame>
   );
}

export default TrashIcon;
