import IconFrame from '@components/icons/events/IconFrame';
import { edge, team } from '@components/icons/events/iconStyles';
import type { IconProps } from '@components/types';

function BlockedShotIcon(props: IconProps) {
   return (
      <IconFrame {...props}>
         <circle cx={8} cy={8} r={6} {...edge(3)} />
         <line x1={4.46} y1={11.54} x2={11.54} y2={4.46} {...edge(3)} />
         <circle cx={8} cy={8} r={6} {...team(2)} />
         <line x1={4.46} y1={11.54} x2={11.54} y2={4.46} {...team(2)} />
      </IconFrame>
   );
}

export default BlockedShotIcon;
