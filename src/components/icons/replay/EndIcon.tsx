import InlineIconFrame from '@components/icons/InlineIconFrame';
import type { InlineIconProps } from '@components/types';

function EndIcon(props: InlineIconProps) {
   return (
      <InlineIconFrame {...props}>
         <path d="M16 6h2v12h-2zM6 6l8.5 6L6 18z" />
      </InlineIconFrame>
   );
}

export default EndIcon;
