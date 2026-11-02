import '@components/OnIcePanel.css';
import { useGame } from '@context/GameContext.tsx';
import type { TimedShift } from '@domain/onIce.ts';
import type { Player } from '@domain/types.ts';
import type { Side } from '@engine/types.ts';
import PlayerCard from '@components/PlayerCard.tsx';

type OnIcePanelProps = {
   side: Side;
   onIce: TimedShift[];
   position: 'left' | 'right';
};

const POSITION_ORDER = ['L', 'C', 'R', 'D', 'G'];

const byPosition = (a: Player, b: Player): number =>
   POSITION_ORDER.indexOf(a.positionCode) - POSITION_ORDER.indexOf(b.positionCode) || a.sweaterNumber - b.sweaterNumber;

const isGoalie = (player: Player): boolean => player.positionCode === 'G';

function OnIcePanel({ side, onIce, position }: OnIcePanelProps) {
   const { playerById, teamByHomeOrAway } = useGame();
   const team = teamByHomeOrAway(side);

   const players = onIce
      .filter(({ teamId }) => teamId === team.id)
      .flatMap(({ playerId }) => playerById(playerId) ?? [])
      .toSorted(byPosition);
   const skaters = players.filter((player) => !isGoalie(player));
   const goalies = players.filter(isGoalie);

   const card = (player: Player) => (
      <li key={player.playerId}>
         <PlayerCard player={player} team={team} mirrored={position === 'left'} />
      </li>
   );

   return (
      <div className={`on-ice on-ice--${position}`} aria-label={`${team.abbrev} on the ice`}>
         <ol className="on-ice__column">{skaters.map(card)}</ol>
         <ol className="on-ice__column">
            {goalies.map(card)}
            {goalies.length === 0 && <li className="on-ice__empty-net">Empty net</li>}
         </ol>
      </div>
   );
};

export default OnIcePanel;
