import InlineIconFrame from '@components/icons/InlineIconFrame';
import type { InlineIconProps } from '@components/types';

function PauseIcon(props: InlineIconProps) {
   return (
      <InlineIconFrame {...props}>
         <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
      </InlineIconFrame>
   );
}

export default PauseIcon;
