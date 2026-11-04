import ReplayScreen from '@views/ReplayView/ReplayScreen';
import { useReplay } from '@hooks/useReplay';
import { useGame } from '@context/useGame';

function ReplayView() {
   const game = useGame();
   const replay = useReplay();
   return <ReplayScreen game={game} replay={replay} />;
}

export default ReplayView;
