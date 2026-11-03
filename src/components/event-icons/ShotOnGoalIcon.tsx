import IconFrame from '@components/event-icons/IconFrame';
import type { IconProps } from '@components/event-icons/IconFrame';
import { filled } from '@components/event-icons/iconStyles';

function ShotOnGoalIcon(props: IconProps) {
   return (
      <IconFrame {...props}>
         <circle cx={8} cy={8} r={6} {...filled} />
      </IconFrame>
   );
};

export default ShotOnGoalIcon;
