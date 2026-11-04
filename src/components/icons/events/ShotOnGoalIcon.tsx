import IconFrame from '@components/icons/events/IconFrame';
import { filled } from '@components/icons/events/iconStyles';
import type { IconProps } from '@components/types';

function ShotOnGoalIcon(props: IconProps) {
   return (
      <IconFrame {...props}>
         <circle cx={8} cy={8} r={6} {...filled} />
      </IconFrame>
   );
}

export default ShotOnGoalIcon;
