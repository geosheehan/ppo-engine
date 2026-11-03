import type { ComponentType } from 'react';
import { useGame } from '@context/useGame';
import { boundToIce, CENTER_DOT, nearestFaceoffDot } from '@layout/rink';
import { PLAY_TYPES } from '@domain/constants';
import type { Play, PlayType } from '@domain/types';
import type { IconProps } from '@components/event-icons/IconFrame';
import BlockedShotIcon from '@components/event-icons/BlockedShotIcon';
import DelayedPenaltyIcon from '@components/event-icons/DelayedPenaltyIcon';
import FaceoffIcon from '@components/event-icons/FaceoffIcon';
import GiveawayIcon from '@components/event-icons/GiveawayIcon';
import HitIcon from '@components/event-icons/HitIcon';
import MissedShotIcon from '@components/event-icons/MissedShotIcon';
import PenaltyIcon from '@components/event-icons/PenaltyIcon';
import ShotOnGoalIcon from '@components/event-icons/ShotOnGoalIcon';
import StoppageIcon from '@components/event-icons/StoppageIcon';
import TakeawayIcon from '@components/event-icons/TakeawayIcon';

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

// Icon width on the rink, in feet.
export const MARKER_SIZE = 5;

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
   const color = play.typeDescKey === PLAY_TYPES.STOPPAGE
      ? STOPPAGE_COLOR
      : eventOwnerTeamId ? teamColor(eventOwnerTeamId) : undefined;

   let point = CENTER_DOT;
   if (xCoord !== undefined && yCoord !== undefined) {
      const recorded = { x: xCoord, y: yCoord };
      point = play.typeDescKey === PLAY_TYPES.FACEOFF ? nearestFaceoffDot(recorded) : boundToIce(recorded);
   }

   return <Icon className={className} x={point.x} y={point.y} size={MARKER_SIZE} color={color} />;
};

export default PlayMarker;
