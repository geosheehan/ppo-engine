import type { ComponentType } from 'react';
import type { Play } from '@domain/types.ts';
import type { IconProps } from '@components/event-icons/IconFrame.tsx';
import BlockedShotIcon from '@components/event-icons/BlockedShotIcon.tsx';
import FaceoffIcon from '@components/event-icons/FaceoffIcon.tsx';
import GiveawayIcon from '@components/event-icons/GiveawayIcon.tsx';
import HitIcon from '@components/event-icons/HitIcon.tsx';
import MissedShotIcon from '@components/event-icons/MissedShotIcon.tsx';
import PenaltyIcon from '@components/event-icons/PenaltyIcon.tsx';
import ShotOnGoalIcon from '@components/event-icons/ShotOnGoalIcon.tsx';
import TakeawayIcon from '@components/event-icons/TakeawayIcon.tsx';

// Icon per play type. Only types that carry a rink location; goals use the shot icon for now.
const ICONS: Record<string, ComponentType<IconProps>> = {
   'shot-on-goal': ShotOnGoalIcon,
   'goal': ShotOnGoalIcon,
   'missed-shot': MissedShotIcon,
   'blocked-shot': BlockedShotIcon,
   'hit': HitIcon,
   'giveaway': GiveawayIcon,
   'takeaway': TakeawayIcon,
   'faceoff': FaceoffIcon,
   'penalty': PenaltyIcon,
};

// Icon width on the rink, in feet.
const SIZE = 5;

type LocatedDetails = {
   xCoord?: number;
   yCoord?: number;
   eventOwnerTeamId?: number;
};

type PlayMarkerProps = {
   play: Play;
   // Colour for each team id; a play without an owning team falls back to the inherited colour.
   teamColor: (teamId: number) => string;
   className?: string;
};

// The play's icon at its spot on the rink. Draws nothing for plays without a location
// (stoppages, period starts, some older penalties) or without an icon.
function PlayMarker({ play, teamColor, className }: PlayMarkerProps) {
   const Icon = ICONS[play.typeDescKey];
   const { xCoord, yCoord, eventOwnerTeamId } = (play.details ?? {}) as LocatedDetails;
   if (!Icon || xCoord === undefined || yCoord === undefined) return null;

   return (
      <Icon
         className={className}
         x={xCoord}
         y={yCoord}
         size={SIZE}
         color={eventOwnerTeamId ? teamColor(eventOwnerTeamId) : undefined}
      />
   );
};

export default PlayMarker;
