import ReplayIconFrame from '@components/replay-icons/ReplayIconFrame';
import type { ReplayIconProps } from '@components/replay-icons/ReplayIconFrame';

function EndIcon(props: ReplayIconProps) {
   return (
      <ReplayIconFrame {...props}>
         <path d="M16 6h2v12h-2zM6 6l8.5 6L6 18z" />
      </ReplayIconFrame>
   );
};

export default EndIcon;
