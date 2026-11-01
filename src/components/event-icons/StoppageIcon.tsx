import IconFrame from '@components/event-icons/IconFrame.tsx';
import type { IconProps } from '@components/event-icons/IconFrame.tsx';
import { filled } from '@components/event-icons/iconStyles.ts';

function StoppageIcon(props: IconProps) {
   return (
      <IconFrame {...props}>
         <rect x={3} y={3} width={2.5} height={10} {...filled} />
         <rect x={10.5} y={3} width={2.5} height={10} {...filled} />
      </IconFrame>
   );
};

export default StoppageIcon;
