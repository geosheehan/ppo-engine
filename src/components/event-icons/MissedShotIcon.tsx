import IconFrame from '@components/event-icons/IconFrame.tsx';
import type { IconProps } from '@components/event-icons/IconFrame.tsx';
import { edge, team } from '@components/event-icons/iconStyles.ts';

function MissedShotIcon(props: IconProps) {
   return (
      <IconFrame {...props}>
         <circle cx={8} cy={8} r={6} {...edge(3)} />
         <circle cx={8} cy={8} r={6} {...team(2)} />
      </IconFrame>
   );
};

export default MissedShotIcon;
