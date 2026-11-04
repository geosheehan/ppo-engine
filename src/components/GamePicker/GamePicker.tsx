import '@components/GamePicker/GamePicker.css';
import type { GameSummary } from '@api/types';
import { gameLabel } from '@layout/gameLabel';

type GamePickerProps = {
   games: GameSummary[];
   selectedId: string;
   onSelect: (id: string) => void;
};

function GamePicker({ games, selectedId, onSelect }: GamePickerProps) {
   return (
      <label className="game-picker">
         Game
         <select
            className="game-picker__select"
            value={selectedId}
            onChange={(event) => onSelect(event.target.value)}
         >
            {games.map((game) => (
               <option key={game.id} value={game.id}>
                  {gameLabel(game)}
               </option>
            ))}
         </select>
      </label>
   );
}

export default GamePicker;
