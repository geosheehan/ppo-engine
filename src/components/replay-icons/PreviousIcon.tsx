import ReplayIconFrame from '@components/replay-icons/ReplayIconFrame';
import type { ReplayIconProps } from '@components/replay-icons/ReplayIconFrame';

function PreviousIcon(props: ReplayIconProps) {
   return (
      <ReplayIconFrame {...props}>
         <path d="M16 6v12l-8.5-6z" />
      </ReplayIconFrame>
   );
};

export default PreviousIcon;
