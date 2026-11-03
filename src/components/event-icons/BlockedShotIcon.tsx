import IconFrame from '@components/event-icons/IconFrame';
import type { IconProps } from '@components/event-icons/IconFrame';
import { edge, team } from '@components/event-icons/iconStyles';

function BlockedShotIcon(props: IconProps) {
   return (
      <IconFrame {...props}>
         <circle cx={8} cy={8} r={6} {...edge(3)} />
         <line x1={4.46} y1={11.54} x2={11.54} y2={4.46} {...edge(3)} />
         <circle cx={8} cy={8} r={6} {...team(2)} />
         <line x1={4.46} y1={11.54} x2={11.54} y2={4.46} {...team(2)} />
      </IconFrame>
   );
};

export default BlockedShotIcon;
