import { MARKER_SIZE } from '@components/constants';
import ShotOnGoalIcon from '@components/icons/events/ShotOnGoalIcon';
import { useShotProgress } from '@hooks/useShotProgress';
import { useGame } from '@context/useGame';
import { attackedNet, boundToIce } from '@layout/rink';
import { SIDES } from '@domain/constants';
import { isGoal } from '@domain/plays';
import type { Play } from '@domain/types';

type ShotLineProps = {
   play: Play;
   homeOnLeft: boolean;
   className?: string;
};

// A goal's path from where the shot was taken to the net it went in, with the shot's icon travelling along it.
// The line shrinks behind the icon, so only the part still ahead of the shot is drawn.
function ShotLine({ play, homeOnLeft, className }: ShotLineProps) {
   const { sideOf, teamColor } = useGame();
   const progress = useShotProgress();
   if (!isGoal(play)) return null;

   const { xCoord, yCoord, eventOwnerTeamId } = play.details;
   if (xCoord === undefined || yCoord === undefined) return null;

   const shot = boundToIce({ x: xCoord, y: yCoord });
   const net = attackedNet(sideOf(eventOwnerTeamId) === SIDES.HOME, homeOnLeft);
   const puck = {
      x: shot.x + (net.x - shot.x) * progress,
      y: shot.y + (net.y - shot.y) * progress,
   };
   const color = teamColor(eventOwnerTeamId);

   return (
      <>
         {progress < 1 && (
            <line
               x1={puck.x}
               y1={puck.y}
               x2={net.x}
               y2={net.y}
               stroke={color}
               strokeWidth={0.75}
               strokeDasharray="2 1.5"
               strokeDashoffset={Math.hypot(puck.x - shot.x, puck.y - shot.y)}
               strokeLinecap="round"
            />
         )}
         <ShotOnGoalIcon
            className={className}
            x={puck.x}
            y={puck.y}
            size={MARKER_SIZE}
            color={color}
         />
      </>
   );
}

export default ShotLine;
