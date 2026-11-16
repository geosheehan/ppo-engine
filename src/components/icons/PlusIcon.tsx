import InlineIconFrame from '@components/icons/InlineIconFrame';
import type { InlineIconProps } from '@components/types';

function PlusIcon(props: InlineIconProps) {
   return (
      <InlineIconFrame {...props}>
         <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />
      </InlineIconFrame>
   );
}

export default PlusIcon;
