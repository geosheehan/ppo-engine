import IconFrame from '@components/icons/events/IconFrame';
import { filled } from '@components/icons/events/iconStyles';
import type { IconProps } from '@components/types';

function PenaltyIcon(props: IconProps) {
   return (
      <IconFrame {...props}>
         <rect x={2} y={2} width={12} height={12} {...filled} />
      </IconFrame>
   );
}

export default PenaltyIcon;
