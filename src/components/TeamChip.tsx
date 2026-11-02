import '@components/TeamChip.css';
import type { CSSProperties } from 'react';
import { useGame } from '@context/GameContext.tsx';
import { textColorOn } from '@domain/colors.ts';

type TeamChipProps = {
   teamId: number;
};

function TeamChip({ teamId }: TeamChipProps) {
   const { teamById, teamColor } = useGame();
   const color = teamColor(teamId);

   return (
      <span className="team-chip" style={{ '--chip-color': color, '--chip-text-color': textColorOn(color) } as CSSProperties}>
         {teamById(teamId)?.abbrev.toUpperCase()}
      </span>
   );
};

export default TeamChip;
