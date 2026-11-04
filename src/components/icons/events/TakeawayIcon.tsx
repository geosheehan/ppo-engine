import IconFrame from '@components/icons/events/IconFrame';
import { edge, round, team } from '@components/icons/events/iconStyles';
import type { IconProps } from '@components/types';

function TakeawayIcon(props: IconProps) {
   return (
      <IconFrame {...props}>
         <polyline points="3,11 8,5 13,11" {...edge(4.5)} {...round} />
         <polyline points="3,11 8,5 13,11" {...team(2.5)} {...round} />
      </IconFrame>
   );
}

export default TakeawayIcon;
