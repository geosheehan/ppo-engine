import '@components/OnIcePanel/OnIcePanel.css';
import { useState } from 'react';
import { clsx } from 'clsx';
import PlayerCard from '@components/PlayerCard';
import { textColorOn } from '@domain/colors';
import { POSITION_CODES } from '@domain/constants';
import { byPosition, keepSlots } from '@domain/lineup';
import type { Player, Side, Team } from '@domain/types';

type OnIcePanelProps = {
   position: 'left' | 'right';
   side: Side;
   team?: Team;
   color?: string;
   players?: Player[];
   highlighted?: number[];
};

const SKATER_SLOTS = 5;
const NO_PLAYERS: Player[] = [];
const NO_IDS: number[] = [];

const isGoalie = (player: Player): boolean => player.positionCode === POSITION_CODES.GOALIE;

const idsOf = (players: Player[]): string =>
   players
      .map(({ playerId }) => playerId)
      .toSorted((a, b) => a - b)
      .join();

function OnIcePanel({
   position,
   side,
   team,
   color,
   players,
   highlighted = NO_IDS,
}: OnIcePanelProps) {
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
   const chip = (player: Player) => (
      <li
         key={player.playerId}
         className={clsx(
            'on-ice__number',
            isGoalie(player) && 'on-ice__number--goalie',
            highlighted.includes(player.playerId) && 'on-ice__number--highlighted',
            arrivals.includes(player.playerId) && 'on-ice__arrival',
         )}
      >
         <span className="visually-hidden">{player.lastName.default} </span>
         {player.sweaterNumber}
      </li>
   );

   const emptyNet = players !== undefined && goalies.length === 0;

   return (
      <div
         className={`on-ice on-ice--${position} on-ice--${side}`}
         aria-label={team && `${team.abbrev} on the ice`}
         style={
            color !== undefined
               ? { '--team-color': color, '--team-text-color': textColorOn(color) }
               : undefined
         }
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
         <ol className="on-ice__numbers">
            {players ? (
               <>
                  {skaters.map(chip)}
                  {goalies.map(chip)}
                  {goalies.length === 0 && (
                     <li className="on-ice__number on-ice__number--goalie on-ice__number--empty-net">
                        <abbr title="Empty net">EN</abbr>
                     </li>
                  )}
               </>
            ) : (
               Array.from({ length: SKATER_SLOTS + 1 }, (_, i) => (
                  <li key={i} className="on-ice__number on-ice__number--blank" />
               ))
            )}
         </ol>
         <div className={clsx('on-ice__net', emptyNet && 'on-ice__net--empty')}>
            {emptyNet && 'Empty net'}
         </div>
      </div>
   );
}

export default OnIcePanel;
