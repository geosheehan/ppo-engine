import InlineIconFrame from '@components/icons/InlineIconFrame';
import type { InlineIconProps } from '@components/types';

function PreviousIcon(props: InlineIconProps) {
   return (
      <InlineIconFrame {...props}>
         <path d="M16 6v12l-8.5-6z" />
      </InlineIconFrame>
   );
}

export default PreviousIcon;
