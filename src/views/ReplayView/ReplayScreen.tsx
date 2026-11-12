import '@views/ReplayView/ReplayView.css';
import CurrentPlay from '@components/CurrentPlay';
import OnIcePanel from '@components/OnIcePanel';
import PenaltyClocks from '@components/PenaltyClocks';
import PlayMarker from '@components/PlayMarker';
import PlayParticipants from '@components/PlayParticipants';
import ReplayControls from '@components/ReplayControls';
import Rink from '@components/Rink';
import Scoreboard from '@components/Scoreboard';
import ShotLine from '@components/ShotLine';
import StrengthTable from '@components/StrengthTable';
import StrengthTableMerged from '@components/StrengthTable/StrengthTableMerged';
import type { Replay } from '@hooks/types';
import type { GameContextValue } from '@context/types';
import { SIDES } from '@domain/constants';
import { isGoal } from '@domain/plays';
import type { Side } from '@domain/types';

type ReplayScreenProps = {
   game?: GameContextValue;
   replay?: Replay;
   emptyTitle?: string;
};

const AWAY_HOME: [Side, Side] = [SIDES.AWAY, SIDES.HOME];
const HOME_AWAY: [Side, Side] = [SIDES.HOME, SIDES.AWAY];
const NEUTRAL_END = 'var(--border)';

// Without a game and replay, every part draws its empty state. That is the page shown while a game loads.
function ReplayScreen({ game, replay, emptyTitle = 'Loading game' }: ReplayScreenProps) {
   const sides = replay?.sides ?? AWAY_HOME;
   const [left, right] = sides;
   const play = replay?.play;
   const isLineChange = replay?.changedTeamId !== undefined;
   const team = (side: Side) => game?.teamByHomeOrAway(side);
   const title = game ? `${game.game.awayTeam.abbrev} @ ${game.game.homeTeam.abbrev}` : emptyTitle;
   const teamIds = game && {
      away: game.teamByHomeOrAway(SIDES.AWAY).id,
      home: game.teamByHomeOrAway(SIDES.HOME).id,
   };

   // A power-play goal ends the penalty in the same second, so the snapshot already shows the strength after the
   // goal. Show the strength it was scored at until the next play.
   const liveStrength = replay && (replay.goalEffect?.strength ?? replay.snapshot.strength);
   const scoringSide =
      play && isGoal(play) && !isLineChange
         ? game?.sideOf(play.details.eventOwnerTeamId)
         : undefined;
   const participantIds = replay?.participants.lists.flatMap(({ cards }) =>
      cards.map(({ player }) => player.playerId),
   );
   const shotLocated =
      play !== undefined
      && isGoal(play)
      && play.details.xCoord !== undefined
      && play.details.yCoord !== undefined;

   return (
      <main
         className="replay"
         style={{
            '--rink-left-end-color': game?.colors[left] ?? NEUTRAL_END,
            '--rink-right-end-color': game?.colors[right] ?? NEUTRAL_END,
         }}
      >
         <title>{title}</title>
         <h1 className="visually-hidden">{title}</h1>
         <header className="replay__header">
            <Scoreboard
               play={play}
               time={replay?.time}
               score={replay?.score}
               teamIds={teamIds}
               homeOnLeft={replay?.homeOnLeft}
               scoringSide={scoringSide}
            />
            <CurrentPlay
               play={play}
               player={replay?.featuredPlayer}
               goalEffect={replay?.goalEffect}
               changedTeamId={replay?.changedTeamId}
               participants={replay?.participants}
               abbrevs={
                  game && { away: game.game.awayTeam.abbrev, home: game.game.homeTeam.abbrev }
               }
            />
         </header>
         <PlayParticipants layout={replay?.participants} />
         <div className="replay__stage">
            <div className="replay__ice">
               <OnIcePanel
                  key={left}
                  position="left"
                  side={left}
                  team={team(left)}
                  color={game?.colors[left]}
                  players={replay?.onIcePlayers[left]}
                  highlighted={participantIds}
               />
               <div className="replay__center">
                  <Rink className="replay__rink">
                     {replay
                        && !isLineChange
                        && (shotLocated ? (
                           <ShotLine
                              key={replay.play.eventId}
                              play={replay.play}
                              homeOnLeft={replay.homeOnLeft}
                              className="replay__icon"
                           />
                        ) : (
                           <PlayMarker
                              play={replay.play}
                              locatedBy={replay.calledPenalty}
                              className="replay__icon"
                           />
                        ))}
                  </Rink>
                  <div className="replay__clocks">
                     {sides.map((side, i) => (
                        <PenaltyClocks
                           key={side}
                           side={side}
                           onClock={replay?.snapshot.onClock}
                           position={i === 0 ? 'left' : 'right'}
                        />
                     ))}
                  </div>
               </div>
               <OnIcePanel
                  key={right}
                  position="right"
                  side={right}
                  team={team(right)}
                  color={game?.colors[right]}
                  players={replay?.onIcePlayers[right]}
                  highlighted={participantIds}
               />
            </div>
         </div>
         <ReplayControls
            index={replay?.index}
            time={replay?.time}
            plays={replay?.plays}
            steps={replay?.steps}
            stepIndex={replay?.stepIndex}
            onChange={replay?.setPosition}
         />
         <div className="replay__tables">
            {sides.map((side, i) => (
               <StrengthTable
                  key={side}
                  side={side}
                  position={i === 0 ? 'left' : 'right'}
                  team={team(side)}
                  color={game?.colors[side]}
                  totals={replay?.totals[side]}
                  strength={liveStrength}
               />
            ))}
            <StrengthTableMerged
               teams={HOME_AWAY.map((side) => ({
                  side,
                  team: team(side),
                  color: game?.colors[side],
                  totals: replay?.totals[side],
               }))}
               strength={liveStrength}
            />
         </div>
      </main>
   );
}

export default ReplayScreen;
