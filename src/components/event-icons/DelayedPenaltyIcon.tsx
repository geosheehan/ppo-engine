import IconFrame from '@components/event-icons/IconFrame';
import type { IconProps } from '@components/event-icons/IconFrame';
import { edge, team } from '@components/event-icons/iconStyles';

function DelayedPenaltyIcon(props: IconProps) {
   return (
      <IconFrame {...props}>
         <rect x={0} y={0} width={16} height={16} fill="#ffffff" />
         <rect x={3} y={3} width={10} height={10} {...edge(4)} />
         <rect x={3} y={3} width={10} height={10} {...team(2)} />
      </IconFrame>
   );
};

export default DelayedPenaltyIcon;
