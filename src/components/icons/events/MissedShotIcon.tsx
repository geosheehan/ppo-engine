import IconFrame from '@components/icons/events/IconFrame';
import { edge, team } from '@components/icons/events/iconStyles';
import type { IconProps } from '@components/types';

function MissedShotIcon(props: IconProps) {
   return (
      <IconFrame {...props}>
         <circle cx={8} cy={8} r={6} {...edge(3)} />
         <circle cx={8} cy={8} r={6} {...team(2)} />
      </IconFrame>
   );
}

export default MissedShotIcon;
