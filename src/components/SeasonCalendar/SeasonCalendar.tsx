import '@components/SeasonCalendar/SeasonCalendar.css';
import { useState } from 'react';
import { clsx } from 'clsx';
import { localDate } from '@layout/gamePicker';
import {
   monthGrid,
   monthLabel,
   monthOf,
   monthYearLabel,
   seasonLabel,
   seasonMonths,
   seasonOf,
   seasonsUpTo,
} from '@layout/seasonCalendar';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type SeasonCalendarProps = {
   date: string;
   onPick: (date: string) => void;
};

function SeasonCalendar({ date, onPick }: SeasonCalendarProps) {
   const [today] = useState(() => localDate(new Date()));
   const [season, setSeason] = useState(() => seasonOf(date));
   const [month, setMonth] = useState(() => monthOf(date));

   return (
      <div className="season-calendar">
         <label className="season-calendar__season">
            Season
            <select value={season} onChange={(event) => setSeason(Number(event.target.value))}>
               {seasonsUpTo(today).map((option) => (
                  <option key={option} value={option}>
                     {seasonLabel(option)}
                  </option>
               ))}
            </select>
         </label>
         <div className="season-calendar__months" role="group" aria-label="Month">
            {seasonMonths().map((option) => (
               <button
                  key={option}
                  type="button"
                  className={clsx(
                     'season-calendar__month',
                     option === month && 'season-calendar__month--selected',
                  )}
                  aria-pressed={option === month}
                  onClick={() => setMonth(option)}
               >
                  {monthLabel(option)}
               </button>
            ))}
         </div>
         <table className="season-calendar__days">
            <caption>{monthYearLabel(season, month)}</caption>
            <thead>
               <tr>
                  {WEEKDAYS.map((weekday) => (
                     <th key={weekday} scope="col">
                        {weekday.slice(0, 2)}
                     </th>
                  ))}
               </tr>
            </thead>
            <tbody>
               {monthGrid(season, month).map((week) => (
                  <tr key={week.find((day) => day !== undefined)}>
                     {week.map((day, index) => (
                        <td key={day ?? `blank-${index}`}>
                           {day !== undefined && (
                              <button
                                 type="button"
                                 className={clsx(
                                    'season-calendar__day',
                                    day === date && 'season-calendar__day--selected',
                                    day === today && 'season-calendar__day--today',
                                 )}
                                 aria-current={day === date ? 'date' : undefined}
                                 onClick={() => onPick(day)}
                              >
                                 {Number(day.slice(8))}
                              </button>
                           )}
                        </td>
                     ))}
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
   );
}

export default SeasonCalendar;
