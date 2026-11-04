import '@components/TeamChip.css';
import type { CSSProperties } from 'react';
import { useGame } from '@context/useGame';
import { textColorOn } from '@domain/colors';

type TeamChipProps = {
   teamId: number;
};

function TeamChip({ teamId }: TeamChipProps) {
   const { teamById, teamColor } = useGame();
   const color = teamColor(teamId);

   return (
      <span
         className="team-chip"
         style={{ '--chip-color': color, '--chip-text-color': textColorOn(color) } as CSSProperties}
      >
         {teamById(teamId)?.abbrev}
      </span>
   );
}

export default TeamChip;
