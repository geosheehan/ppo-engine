import '@components/OnIcePanel/OnIcePanel.css';
import { useState } from 'react';
import { clsx } from 'clsx';
import PlayerCard from '@components/PlayerCard';
import { POSITION_CODES } from '@domain/constants';
import { byPosition, keepSlots } from '@domain/lineup';
import type { Player, Team } from '@domain/types';

type OnIcePanelProps = {
   position: 'left' | 'right';
   team?: Team;
   color?: string;
   players?: Player[];
};

const SKATER_SLOTS = 5;
const NO_PLAYERS: Player[] = [];

const isGoalie = (player: Player): boolean => player.positionCode === POSITION_CODES.GOALIE;

const idsOf = (players: Player[]): string =>
   players
      .map(({ playerId }) => playerId)
      .toSorted((a, b) => a - b)
      .join();

function OnIcePanel({ position, team, color, players }: OnIcePanelProps) {
   const onIce = players ?? NO_PLAYERS;
   const goalies = onIce.filter(isGoalie);
   const onIceSkaters = onIce.filter((player) => !isGoalie(player));
   const mirrored = position === 'left';

   const [skaters, setSkaters] = useState(() => onIceSkaters.toSorted(byPosition));
   const [shown, setShown] = useState(onIce);
   const [arrivals, setArrivals] = useState<number[]>([]);
   if (idsOf(onIce) !== idsOf(shown)) {
      setSkaters(keepSlots(skaters, onIceSkaters));
      setShown(onIce);
      setArrivals(
         onIce.filter((player) => !shown.includes(player)).map(({ playerId }) => playerId),
      );
   }

   const card = (player: Player) => (
      <li
         key={player.playerId}
         className={clsx(arrivals.includes(player.playerId) && 'on-ice__arrival')}
      >
         <PlayerCard player={player} team={team} color={color} mirrored={mirrored} />
      </li>
   );
   const emptyCards = (count: number) =>
      Array.from({ length: count }, (_, i) => (
         <li key={i}>
            <PlayerCard mirrored={mirrored} />
         </li>
      ));

   return (
      <div
         className={`on-ice on-ice--${position}`}
         aria-label={team && `${team.abbrev} on the ice`}
         style={color !== undefined ? { '--team-color': color } : undefined}
      >
         <div className="on-ice__lines">
            <ol className="on-ice__column">
               {players ? skaters.map(card) : emptyCards(SKATER_SLOTS)}
            </ol>
            <ol className="on-ice__column">
               {players ? (
                  <>
                     {goalies.map(card)}
                     {goalies.length === 0 && <li className="on-ice__empty-net">Empty net</li>}
                  </>
               ) : (
                  emptyCards(1)
               )}
            </ol>
         </div>
      </div>
   );
}

export default OnIcePanel;
