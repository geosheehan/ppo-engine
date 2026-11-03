import IconFrame from '@components/event-icons/IconFrame';
import type { IconProps } from '@components/event-icons/IconFrame';
import { edge, round, team } from '@components/event-icons/iconStyles';

function TakeawayIcon(props: IconProps) {
   return (
      <IconFrame {...props}>
         <polyline points="3,11 8,5 13,11" {...edge(4.5)} {...round} />
         <polyline points="3,11 8,5 13,11" {...team(2.5)} {...round} />
      </IconFrame>
   );
};

export default TakeawayIcon;
