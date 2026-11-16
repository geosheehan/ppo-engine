import InlineIconFrame from '@components/icons/InlineIconFrame';
import type { InlineIconProps } from '@components/types';

function PlayIcon(props: InlineIconProps) {
   return (
      <InlineIconFrame {...props}>
         <path d="M8 5v14l11-7z" />
      </InlineIconFrame>
   );
}

export default PlayIcon;
