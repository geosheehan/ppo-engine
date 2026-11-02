import ReplayIconFrame from '@components/replay-icons/ReplayIconFrame.tsx';
import type { ReplayIconProps } from '@components/replay-icons/ReplayIconFrame.tsx';

function PreviousIcon(props: ReplayIconProps) {
   return (
      <ReplayIconFrame {...props}>
         <path d="M16 6v12l-8.5-6z" />
      </ReplayIconFrame>
   );
};

export default PreviousIcon;
