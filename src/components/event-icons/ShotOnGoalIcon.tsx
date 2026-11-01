import IconFrame from '@components/event-icons/IconFrame.tsx';
import type { IconProps } from '@components/event-icons/IconFrame.tsx';
import { filled } from '@components/event-icons/iconStyles.ts';

function ShotOnGoalIcon(props: IconProps) {
   return (
      <IconFrame {...props}>
         <circle cx={8} cy={8} r={6} {...filled} />
      </IconFrame>
   );
};

export default ShotOnGoalIcon;
