import ReplayIconFrame from '@components/icons/replay/ReplayIconFrame';
import type { ReplayIconProps } from '@components/types';

function PlayIcon(props: ReplayIconProps) {
   return (
      <ReplayIconFrame {...props}>
         <path d="M8 5v14l11-7z" />
      </ReplayIconFrame>
   );
}

export default PlayIcon;
