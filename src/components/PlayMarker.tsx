import type { ComponentType } from 'react';
import { useGame } from '@context/GameContext.tsx';
import { boundToIce, CENTER_DOT, nearestFaceoffDot } from '@domain/rink.ts';
import type { Play } from '@domain/types.ts';
import type { IconProps } from '@components/event-icons/IconFrame.tsx';
import BlockedShotIcon from '@components/event-icons/BlockedShotIcon.tsx';
import FaceoffIcon from '@components/event-icons/FaceoffIcon.tsx';
import GiveawayIcon from '@components/event-icons/GiveawayIcon.tsx';
import HitIcon from '@components/event-icons/HitIcon.tsx';
import MissedShotIcon from '@components/event-icons/MissedShotIcon.tsx';
import PenaltyIcon from '@components/event-icons/PenaltyIcon.tsx';
import ShotOnGoalIcon from '@components/event-icons/ShotOnGoalIcon.tsx';
import StoppageIcon from '@components/event-icons/StoppageIcon.tsx';
import TakeawayIcon from '@components/event-icons/TakeawayIcon.tsx';

const ICONS: Record<string, ComponentType<IconProps>> = {
   'stoppage': StoppageIcon,
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

// Stoppages have no location and belong to neither team: center ice, in black
// (red would disappear into the center line).
const STOPPAGE_COLOR = '#000000';

type LocatedDetails = {
   xCoord?: number;
   yCoord?: number;
   eventOwnerTeamId?: number;
};

type PlayMarkerProps = {
   play: Play;
   teamColor: (teamId: number) => string;
   className?: string;
};

// The play's icon at its spot on the rink. Draws nothing for plays without a location
// (period starts, delayed penalties, some older penalties) or without an icon.
function PlayMarker({ play, className }: PlayMarkerProps) {
   const { teamColor } = useGame();
   const Icon = ICONS[play.typeDescKey];
   if (!Icon) return null;

   if (play.typeDescKey === 'stoppage') {
      return <Icon className={className} x={CENTER_DOT.x} y={CENTER_DOT.y} size={SIZE} color={STOPPAGE_COLOR} />;
   }

   const { xCoord, yCoord, eventOwnerTeamId } = (play.details ?? {}) as LocatedDetails;
   if (xCoord === undefined || yCoord === undefined) return null;

   const recorded = { x: xCoord, y: yCoord };
   const { x, y } = play.typeDescKey === 'faceoff' ? nearestFaceoffDot(recorded) : boundToIce(recorded);

   return (
      <Icon
         className={className}
         x={x}
         y={y}
         size={SIZE}
         color={eventOwnerTeamId ? teamColor(eventOwnerTeamId) : undefined}
      />
   );
};

export default PlayMarker;
