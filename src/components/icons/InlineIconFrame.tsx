import type { ReactNode } from 'react';
import type { InlineIconProps } from '@components/types';

type InlineIconFrameProps = InlineIconProps & {
   children: ReactNode;
};

function InlineIconFrame({ size = 18, children }: InlineIconFrameProps) {
   return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
         {children}
      </svg>
   );
}

export default InlineIconFrame;
