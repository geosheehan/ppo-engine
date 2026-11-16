import InlineIconFrame from '@components/icons/InlineIconFrame';
import type { InlineIconProps } from '@components/types';

function StartIcon(props: InlineIconProps) {
   return (
      <InlineIconFrame {...props}>
         <path d="M6 6h2v12H6zM9.5 12 18 6v12z" />
      </InlineIconFrame>
   );
}

export default StartIcon;
