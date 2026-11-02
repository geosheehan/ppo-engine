import type { ReactNode } from 'react';

export type ReplayIconProps = {
   size?: number;
};

type ReplayIconFrameProps = ReplayIconProps & {
   children: ReactNode;
};

function ReplayIconFrame({ size = 18, children }: ReplayIconFrameProps) {
   return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
         {children}
      </svg>
   );
};

export default ReplayIconFrame;
