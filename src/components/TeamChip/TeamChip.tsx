import '@components/TeamChip/TeamChip.css';
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
         style={{ '--team-color': color, '--team-text-color': textColorOn(color) }}
      >
         {teamById(teamId)?.abbrev}
      </span>
   );
}

export default TeamChip;
