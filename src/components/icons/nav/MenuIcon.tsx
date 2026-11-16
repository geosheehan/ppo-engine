import InlineIconFrame from '@components/icons/InlineIconFrame';
import type { InlineIconProps } from '@components/types';

function MenuIcon(props: InlineIconProps) {
   return (
      <InlineIconFrame {...props}>
         <path d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z" />
      </InlineIconFrame>
   );
}

export default MenuIcon;
