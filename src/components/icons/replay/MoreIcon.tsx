import ReplayIconFrame from '@components/icons/replay/ReplayIconFrame';
import type { ReplayIconProps } from '@components/types';

function MoreIcon(props: ReplayIconProps) {
   return (
      <ReplayIconFrame {...props}>
         <circle cx="5" cy="12" r="2" />
         <circle cx="12" cy="12" r="2" />
         <circle cx="19" cy="12" r="2" />
      </ReplayIconFrame>
   );
}

export default MoreIcon;
