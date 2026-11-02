import '@components/OnIcePanel.css';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useGame } from '@context/GameContext.tsx';
import { byPosition, keepSlots } from '@domain/lineup.ts';
import type { TimedShift } from '@domain/onIce.ts';
import type { Player } from '@domain/types.ts';
import type { Side } from '@engine/types.ts';
import PlayerCard from '@components/PlayerCard.tsx';

type OnIcePanelProps = {
   side: Side;
   onIce: TimedShift[];
   position: 'left' | 'right';
};

const isGoalie = (player: Player): boolean => player.positionCode === 'G';

const idsOf = (players: Player[]): string => players.map(({ playerId }) => playerId).toSorted().join();

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
      setArrivals(players.filter((player) => !shown.includes(player)).map(({ playerId }) => playerId));
   }

   const card = (player: Player) => (
      <li key={player.playerId} className={arrivals.includes(player.playerId) ? 'on-ice__arrival' : undefined}>
         <PlayerCard player={player} team={team} mirrored={position === 'left'} />
      </li>
   );

   return (
      <div
         className={`on-ice on-ice--${position}`}
         aria-label={`${team.abbrev} on the ice`}
         style={{ '--team-color': teamColor(team.id) } as CSSProperties}
      >
         <ol className="on-ice__column">{skaters.map(card)}</ol>
         <ol className="on-ice__column">
            {goalies.map(card)}
            {goalies.length === 0 && <li className="on-ice__empty-net">Empty net</li>}
         </ol>
      </div>
   );
};

export default OnIcePanel;
