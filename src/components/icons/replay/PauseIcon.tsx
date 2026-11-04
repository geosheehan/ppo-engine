import ReplayIconFrame from '@components/icons/replay/ReplayIconFrame';
import type { ReplayIconProps } from '@components/types';

function PauseIcon(props: ReplayIconProps) {
   return (
      <ReplayIconFrame {...props}>
         <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
      </ReplayIconFrame>
   );
}

export default PauseIcon;
