import ReplayIconFrame from '@components/icons/replay/ReplayIconFrame';
import type { ReplayIconProps } from '@components/types';

function CloseIcon(props: ReplayIconProps) {
   return (
      <ReplayIconFrame {...props}>
         <path d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6L19 6.4 17.6 5 12 10.6z" />
      </ReplayIconFrame>
   );
}

export default CloseIcon;
