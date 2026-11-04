import IconFrame from '@components/event-icons/IconFrame';
import type { IconProps } from '@components/event-icons/IconFrame';
import { filled } from '@components/event-icons/iconStyles';

function PenaltyIcon(props: IconProps) {
   return (
      <IconFrame {...props}>
         <rect x={2} y={2} width={12} height={12} {...filled} />
      </IconFrame>
   );
}

export default PenaltyIcon;
