import type { TimedShift } from '@domain/types';
import '@components/OnIcePanel/OnIcePanel.css';
import { useState } from 'react';
import { clsx } from 'clsx';
import PlayerCard from '@components/PlayerCard';
import { useGame } from '@context/useGame';
import { POSITION_CODES } from '@domain/constants';
import { byPosition, keepSlots } from '@domain/lineup';
import type { Player, Side } from '@domain/types';

type OnIcePanelProps = {
   side: Side;
   onIce: TimedShift[];
   position: 'left' | 'right';
};

const isGoalie = (player: Player): boolean => player.positionCode === POSITION_CODES.GOALIE;

const idsOf = (players: Player[]): string =>
   players
      .map(({ playerId }) => playerId)
      .toSorted((a, b) => a - b)
      .join();

function OnIcePanel({ side, onIce, position }: OnIcePanelProps) {
   const { playerById, teamByHomeOrAway, teamColor } = useGame();
   const team = teamByHomeOrAway(side);

   const players = onIce
      .filter(({ teamId }) => teamId === team.id)
      .flatMap(({ playerId }) => playerById(playerId) ?? []);
   const goalies = players.filter(isGoalie);
   const onIceSkaters = players.filter((player) => !isGoalie(player));

   const [skaters, setSkaters] = useState(() => onIceSkaters.toSorted(byPosition));
   const [shown, setShown] = useState(players);
   const [arrivals, setArrivals] = useState<number[]>([]);
   if (idsOf(players) !== idsOf(shown)) {
      setSkaters(keepSlots(skaters, onIceSkaters));
      setShown(players);
      setArrivals(
         players.filter((player) => !shown.includes(player)).map(({ playerId }) => playerId),
      );
   }

   const card = (player: Player) => (
      <li
         key={player.playerId}
         className={clsx(arrivals.includes(player.playerId) && 'on-ice__arrival')}
      >
         <PlayerCard player={player} team={team} mirrored={position === 'left'} />
      </li>
   );

   return (
      <div
         className={`on-ice on-ice--${position}`}
         aria-label={`${team.abbrev} on the ice`}
         style={{ '--team-color': teamColor(team.id) }}
      >
         <ol className="on-ice__column">{skaters.map(card)}</ol>
         <ol className="on-ice__column">
            {goalies.map(card)}
            {goalies.length === 0 && <li className="on-ice__empty-net">Empty net</li>}
         </ol>
      </div>
   );
}

export default OnIcePanel;
