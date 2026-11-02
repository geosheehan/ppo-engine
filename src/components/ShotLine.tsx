import { useGame } from '@context/GameContext.tsx';
import { attackedNet, boundToIce } from '@domain/rink.ts';
import { isGoal } from '@domain/types.ts';
import type { Play } from '@domain/types.ts';

type ShotLineProps = {
   play: Play;
   homeOnLeft: boolean;
};

// A goal's path from where the shot was taken to the net it went in. Draw it before the play's icon so
// the icon sits on top of the line's start.
function ShotLine({ play, homeOnLeft }: ShotLineProps) {
   const { game, teamColor } = useGame();
   if (!isGoal(play)) return null;

   const { xCoord, yCoord, eventOwnerTeamId } = play.details;
   if (xCoord === undefined || yCoord === undefined) return null;

   const shot = boundToIce({ x: xCoord, y: yCoord });
   const net = attackedNet(eventOwnerTeamId === game.homeTeam.id, homeOnLeft);

   return (
      <line
         x1={shot.x}
         y1={shot.y}
         x2={net.x}
         y2={net.y}
         stroke={teamColor(eventOwnerTeamId)}
         strokeWidth={0.75}
         strokeDasharray="2 1.5"
         strokeLinecap="round"
      />
   );
};

export default ShotLine;
