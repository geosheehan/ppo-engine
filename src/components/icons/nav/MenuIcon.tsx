import ReplayIconFrame from '@components/icons/replay/ReplayIconFrame';
import type { ReplayIconProps } from '@components/types';

function MenuIcon(props: ReplayIconProps) {
   return (
      <ReplayIconFrame {...props}>
         <path d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z" />
      </ReplayIconFrame>
   );
}

export default MenuIcon;
