import type { ComponentType } from 'react';
import { useGame } from '@context/useGame.ts';
import { boundToIce, CENTER_DOT, nearestFaceoffDot } from '@layout/rink.ts';
import { PLAY_TYPES } from '@domain/constants.ts';
import type { Play, PlayType } from '@domain/types.ts';
import type { IconProps } from '@components/event-icons/IconFrame.tsx';
import BlockedShotIcon from '@components/event-icons/BlockedShotIcon.tsx';
import DelayedPenaltyIcon from '@components/event-icons/DelayedPenaltyIcon.tsx';
import FaceoffIcon from '@components/event-icons/FaceoffIcon.tsx';
import GiveawayIcon from '@components/event-icons/GiveawayIcon.tsx';
import HitIcon from '@components/event-icons/HitIcon.tsx';
import MissedShotIcon from '@components/event-icons/MissedShotIcon.tsx';
import PenaltyIcon from '@components/event-icons/PenaltyIcon.tsx';
import ShotOnGoalIcon from '@components/event-icons/ShotOnGoalIcon.tsx';
import StoppageIcon from '@components/event-icons/StoppageIcon.tsx';
import TakeawayIcon from '@components/event-icons/TakeawayIcon.tsx';

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

type LocatedDetails = {
   xCoord?: number;
   yCoord?: number;
   eventOwnerTeamId?: number;
};

type PlayMarkerProps = {
   play: Play;
   locatedBy?: Play;
   className?: string;
};

const detailsOf = (play: Play): LocatedDetails => (play.details ?? {}) as LocatedDetails;

// The play's icon at its spot on the rink, or at center ice when it has no location. Draws nothing for plays
// without an icon.
function PlayMarker({ play, locatedBy, className }: PlayMarkerProps) {
   const { teamColor } = useGame();
   const Icon = ICONS[play.typeDescKey];
   if (!Icon) return null;

   const { eventOwnerTeamId } = detailsOf(play);
   const { xCoord, yCoord } = detailsOf(locatedBy ?? play);
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
