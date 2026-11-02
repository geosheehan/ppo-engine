import ReplayIconFrame from '@components/replay-icons/ReplayIconFrame.tsx';
import type { ReplayIconProps } from '@components/replay-icons/ReplayIconFrame.tsx';

function NextIcon(props: ReplayIconProps) {
   return (
      <ReplayIconFrame {...props}>
         <path d="M8 6v12l8.5-6z" />
      </ReplayIconFrame>
   );
};

export default NextIcon;
