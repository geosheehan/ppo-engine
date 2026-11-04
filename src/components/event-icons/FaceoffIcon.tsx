import IconFrame from '@components/event-icons/IconFrame';
import type { IconProps } from '@components/event-icons/IconFrame';
import { edge, round, team } from '@components/event-icons/iconStyles';

function FaceoffIcon(props: IconProps) {
   return (
      <IconFrame {...props}>
         <polyline points="3.5,2 11,12.5 13.5,12.5" {...edge(4.25)} {...round} />
         <polyline points="3.5,2 11,12.5 13.5,12.5" {...team(2.25)} {...round} />
         <polyline points="12.5,2 5,12.5 2.5,12.5" {...edge(4.25)} {...round} />
         <polyline points="12.5,2 5,12.5 2.5,12.5" {...team(2.25)} {...round} />
      </IconFrame>
   );
}

export default FaceoffIcon;
