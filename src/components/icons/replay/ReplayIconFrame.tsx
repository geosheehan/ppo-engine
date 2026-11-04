import type { ReactNode } from 'react';
import type { ReplayIconProps } from '@components/types';

type ReplayIconFrameProps = ReplayIconProps & {
   children: ReactNode;
};

function ReplayIconFrame({ size = 18, children }: ReplayIconFrameProps) {
   return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
         {children}
      </svg>
   );
}

export default ReplayIconFrame;
