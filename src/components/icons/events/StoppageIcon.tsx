import IconFrame from '@components/icons/events/IconFrame';
import { filled } from '@components/icons/events/iconStyles';
import type { IconProps } from '@components/types';

function StoppageIcon(props: IconProps) {
   return (
      <IconFrame {...props}>
         <rect x={0} y={0} width={16} height={16} fill="#ffffff" />
         <rect x={3} y={3} width={2.5} height={10} {...filled} />
         <rect x={10.5} y={3} width={2.5} height={10} {...filled} />
      </IconFrame>
   );
}

export default StoppageIcon;
