import IconFrame from '@components/event-icons/IconFrame.tsx';
import type { IconProps } from '@components/event-icons/IconFrame.tsx';
import { edge, team } from '@components/event-icons/iconStyles.ts';

function DelayedPenaltyIcon(props: IconProps) {
   return (
      <IconFrame {...props}>
         <rect x={3} y={3} width={10} height={10} {...edge(4)} />
         <rect x={3} y={3} width={10} height={10} {...team(2)} />
      </IconFrame>
   );
};

export default DelayedPenaltyIcon;
