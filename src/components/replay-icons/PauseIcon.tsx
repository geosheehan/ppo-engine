import ReplayIconFrame from '@components/replay-icons/ReplayIconFrame.tsx';
import type { ReplayIconProps } from '@components/replay-icons/ReplayIconFrame.tsx';

function PauseIcon(props: ReplayIconProps) {
   return (
      <ReplayIconFrame {...props}>
         <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
      </ReplayIconFrame>
   );
};

export default PauseIcon;
