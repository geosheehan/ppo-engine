import type { ReactNode } from 'react';
import type { IconProps } from '@components/types';

type IconFrameProps = IconProps & {
   children: ReactNode;
};

function IconFrame({ className, x = 0, y = 0, size = 16, color, children }: IconFrameProps) {
   return (
      <svg
         className={className}
         x={x - size / 2}
         y={y - size / 2}
         width={size}
         height={size}
         viewBox="0 0 16 16"
         style={{ color }}
         aria-hidden="true"
      >
         {children}
      </svg>
   );
}

export default IconFrame;
