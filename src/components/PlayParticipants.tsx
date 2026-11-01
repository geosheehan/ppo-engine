import '@components/PlayParticipants.css';
import { useGame } from '@context/GameContext.tsx';
import { playParticipants } from '@domain/participants.ts';
import type { Play, Player, Team } from '@domain/types.ts';
import type { Side } from '@engine/types.ts';
import PlayerCard from '@components/PlayerCard.tsx';

type PlayParticipantsProps = {
   play: Play;
   sides: Side[];
};

type Card = { role: string; player: Player; team: Team };

function PlayParticipants({ play, sides }: PlayParticipantsProps) {
   const { game, playerById, teamById } = useGame();

   const cardsBySide: Record<Side, Card[]> = { away: [], home: [] };
   for (const { role, playerId } of playParticipants(play)) {
      const player = playerById(playerId);
      const team = player && teamById(player.teamId);
      if (player && team) cardsBySide[team.id === game.homeTeam.id ? 'home' : 'away'].push({ role, player, team });
   }

   // A goal with two assists names three scoring-team players. The scorer moves across to the goalie's half,
   // nearest the center line, so each half holds two cards and the assists keep the scoring side.
   for (const side of ['home', 'away'] as const) {
      if (cardsBySide[side].length <= 2) continue;
      const [scorer, ...assists] = cardsBySide[side];
      cardsBySide[side] = assists;
      cardsBySide[side === 'home' ? 'away' : 'home'].unshift(scorer);
   }

   return (
      <div className="play-participants">
         {sides.map((side, i) => (
            <ol key={side} className={`play-participants__side play-participants__side--${i === 0 ? 'left' : 'right'}`}>
               {cardsBySide[side].map(({ role, player, team }) => (
                  <li key={`${role}-${player.playerId}`} className="play-participants__card">
                     <PlayerCard player={player} team={team} />
                     <div className="play-participants__role">{role}</div>
                  </li>
               ))}
            </ol>
         ))}
      </div>
   );
};

export default PlayParticipants;
