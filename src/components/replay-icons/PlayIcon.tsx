import ReplayIconFrame from '@components/replay-icons/ReplayIconFrame';
import type { ReplayIconProps } from '@components/replay-icons/ReplayIconFrame';

function PlayIcon(props: ReplayIconProps) {
   return (
      <ReplayIconFrame {...props}>
         <path d="M8 5v14l11-7z" />
      </ReplayIconFrame>
   );
};

export default PlayIcon;
