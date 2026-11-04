import type { ComponentType } from 'react';
import { MARKER_SIZE } from '@components/constants';
import BlockedShotIcon from '@components/icons/events/BlockedShotIcon';
import DelayedPenaltyIcon from '@components/icons/events/DelayedPenaltyIcon';
import FaceoffIcon from '@components/icons/events/FaceoffIcon';
import GiveawayIcon from '@components/icons/events/GiveawayIcon';
import HitIcon from '@components/icons/events/HitIcon';
import MissedShotIcon from '@components/icons/events/MissedShotIcon';
import PenaltyIcon from '@components/icons/events/PenaltyIcon';
import ShotOnGoalIcon from '@components/icons/events/ShotOnGoalIcon';
import StoppageIcon from '@components/icons/events/StoppageIcon';
import TakeawayIcon from '@components/icons/events/TakeawayIcon';
import type { IconProps } from '@components/types';
import { useGame } from '@context/useGame';
import { boundToIce, CENTER_DOT, nearestFaceoffDot } from '@layout/rink';
import { PLAY_TYPES } from '@domain/constants';
import type { Play, PlayType } from '@domain/types';

const ICONS: Partial<Record<PlayType, ComponentType<IconProps>>> = {
   [PLAY_TYPES.STOPPAGE]: StoppageIcon,
   [PLAY_TYPES.SHOT_ON_GOAL]: ShotOnGoalIcon,
   [PLAY_TYPES.GOAL]: ShotOnGoalIcon,
   [PLAY_TYPES.MISSED_SHOT]: MissedShotIcon,
   [PLAY_TYPES.BLOCKED_SHOT]: BlockedShotIcon,
   [PLAY_TYPES.HIT]: HitIcon,
   [PLAY_TYPES.GIVEAWAY]: GiveawayIcon,
   [PLAY_TYPES.TAKEAWAY]: TakeawayIcon,
   [PLAY_TYPES.FACEOFF]: FaceoffIcon,
   [PLAY_TYPES.PENALTY]: PenaltyIcon,
   [PLAY_TYPES.DELAYED_PENALTY]: DelayedPenaltyIcon,
};

const STOPPAGE_COLOR = '#000000';

type PlayMarkerProps = {
   play: Play;
   locatedBy?: Play;
   className?: string;
};

// The play's icon at its spot on the rink, or at center ice when it has no location. Draws nothing for plays
// without an icon.
function PlayMarker({ play, locatedBy, className }: PlayMarkerProps) {
   const { teamColor } = useGame();
   const Icon = ICONS[play.typeDescKey];
   if (!Icon) return null;

   const eventOwnerTeamId = play.details?.eventOwnerTeamId;
   const location = (locatedBy ?? play).details;
   const xCoord = location?.xCoord;
   const yCoord = location?.yCoord;
   const color =
      play.typeDescKey === PLAY_TYPES.STOPPAGE
         ? STOPPAGE_COLOR
         : eventOwnerTeamId !== undefined
           ? teamColor(eventOwnerTeamId)
           : undefined;

   let point = CENTER_DOT;
   if (xCoord !== undefined && yCoord !== undefined) {
      const recorded = { x: xCoord, y: yCoord };
      point =
         play.typeDescKey === PLAY_TYPES.FACEOFF
            ? nearestFaceoffDot(recorded)
            : boundToIce(recorded);
   }

   return <Icon className={className} x={point.x} y={point.y} size={MARKER_SIZE} color={color} />;
}

export default PlayMarker;
