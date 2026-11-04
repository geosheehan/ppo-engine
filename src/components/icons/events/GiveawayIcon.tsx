import IconFrame from '@components/icons/events/IconFrame';
import { edge, round, team } from '@components/icons/events/iconStyles';
import type { IconProps } from '@components/types';

function GiveawayIcon(props: IconProps) {
   return (
      <IconFrame {...props}>
         <polyline points="3,5 8,11 13,5" {...edge(4.5)} {...round} />
         <polyline points="3,5 8,11 13,5" {...team(2.5)} {...round} />
      </IconFrame>
   );
}

export default GiveawayIcon;
