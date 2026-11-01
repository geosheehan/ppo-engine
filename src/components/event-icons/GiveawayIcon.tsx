import IconFrame from '@components/event-icons/IconFrame.tsx';
import type { IconProps } from '@components/event-icons/IconFrame.tsx';
import { edge, round, team } from '@components/event-icons/iconStyles.ts';

function GiveawayIcon(props: IconProps) {
   return (
      <IconFrame {...props}>
         <polyline points="3,5 8,11 13,5" {...edge(4.5)} {...round} />
         <polyline points="3,5 8,11 13,5" {...team(2.5)} {...round} />
      </IconFrame>
   );
};

export default GiveawayIcon;
