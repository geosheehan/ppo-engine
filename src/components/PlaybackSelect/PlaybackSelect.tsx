import { PLAYBACKS } from '@components/constants';
import type { Playback } from '@hooks/types';

type PlaybackSelectProps = {
   value: string;
   disabled?: boolean;
   onChange: (playbackKey: string) => void;
};

const options = (mode: Playback['mode']) =>
   Object.entries(PLAYBACKS)
      .filter(([, playback]) => playback.mode === mode)
      .map(([key, { label }]) => (
         <option key={key} value={key}>
            {label}
         </option>
      ));

function PlaybackSelect({ value, disabled = false, onChange }: PlaybackSelectProps) {
   return (
      <select
         aria-label="Replay speed"
         value={value}
         disabled={disabled}
         onChange={(event) => onChange(event.target.value)}
      >
         <optgroup label="Live clock">{options('live')}</optgroup>
         <optgroup label="Replay length">{options('length')}</optgroup>
      </select>
   );
}

export default PlaybackSelect;
