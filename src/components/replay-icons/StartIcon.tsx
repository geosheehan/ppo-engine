import ReplayIconFrame from '@components/replay-icons/ReplayIconFrame.tsx';
import type { ReplayIconProps } from '@components/replay-icons/ReplayIconFrame.tsx';

function StartIcon(props: ReplayIconProps) {
   return (
      <ReplayIconFrame {...props}>
         <path d="M6 6h2v12H6zM9.5 12 18 6v12z" />
      </ReplayIconFrame>
   );
};

export default StartIcon;
