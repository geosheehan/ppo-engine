import IconFrame from '@components/event-icons/IconFrame.tsx';
import type { IconProps } from '@components/event-icons/IconFrame.tsx';
import { edge, team } from '@components/event-icons/iconStyles.ts';

function HitIcon(props: IconProps) {
   return (
      <IconFrame {...props}>
         <g {...edge(5)} strokeLinecap="round">
            <line x1={8} y1={2.5} x2={8} y2={13.5} />
            <line x1={3.24} y1={5.25} x2={12.76} y2={10.75} />
            <line x1={3.24} y1={10.75} x2={12.76} y2={5.25} />
         </g>
         <g {...team(3)} strokeLinecap="round">
            <line x1={8} y1={2.5} x2={8} y2={13.5} />
            <line x1={3.24} y1={5.25} x2={12.76} y2={10.75} />
            <line x1={3.24} y1={10.75} x2={12.76} y2={5.25} />
         </g>
      </IconFrame>
   );
};

export default HitIcon;
