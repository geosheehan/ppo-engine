import ReplayIconFrame from '@components/replay-icons/ReplayIconFrame.tsx';
import type { ReplayIconProps } from '@components/replay-icons/ReplayIconFrame.tsx';

function PlayIcon(props: ReplayIconProps) {
   return (
      <ReplayIconFrame {...props}>
         <path d="M8 5v14l11-7z" />
      </ReplayIconFrame>
   );
};

export default PlayIcon;
