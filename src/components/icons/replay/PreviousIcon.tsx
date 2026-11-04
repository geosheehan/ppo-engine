import ReplayIconFrame from '@components/icons/replay/ReplayIconFrame';
import type { ReplayIconProps } from '@components/types';

function PreviousIcon(props: ReplayIconProps) {
   return (
      <ReplayIconFrame {...props}>
         <path d="M16 6v12l-8.5-6z" />
      </ReplayIconFrame>
   );
}

export default PreviousIcon;
