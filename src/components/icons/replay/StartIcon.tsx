import ReplayIconFrame from '@components/icons/replay/ReplayIconFrame';
import type { ReplayIconProps } from '@components/types';

function StartIcon(props: ReplayIconProps) {
   return (
      <ReplayIconFrame {...props}>
         <path d="M6 6h2v12H6zM9.5 12 18 6v12z" />
      </ReplayIconFrame>
   );
}

export default StartIcon;
