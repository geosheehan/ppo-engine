import '@components/WhyTable/WhyTable.css';
import type { PointerEvent } from 'react';
import { clsx } from 'clsx';
import { useGame } from '@context/useGame';
import { NO_EVENTS } from '@layout/linkedEvents';
import type { WhyRow } from '@layout/whyNotes';

type WhyTableProps = {
   rows: WhyRow[];
   selectedIds?: ReadonlySet<number>;
   hoveredIds?: ReadonlySet<number>;
   onSelect?: (eventId: number) => void;
   onHover?: (eventId: number | undefined) => void;
};

function WhyTable({
   rows,
   selectedIds = NO_EVENTS,
   hoveredIds = NO_EVENTS,
   onSelect,
   onHover,
}: WhyTableProps) {
   const { colors, teamByHomeOrAway } = useGame();

   if (rows.length === 0) return null;

   return (
      <table className="why-table">
         <caption>Why</caption>
         <thead>
            <tr>
               <th className="why-table__wide">Team</th>
               <th>Penalty</th>
               <th className="why-table__wide">Served</th>
               <th className="why-table__wide">Tag</th>
               <th className="why-table__why">Why</th>
            </tr>
         </thead>
         <tbody>
            {rows.map((row) => {
               const team = teamByHomeOrAway(row.side).abbrev;
               const selected = selectedIds.has(row.eventId);
               return (
                  <tr
                     key={row.key}
                     className={clsx(
                        onSelect && 'why-table__row',
                        selected && 'why-table__row--selected',
                        !selected && hoveredIds.has(row.eventId) && 'why-table__row--hovered',
                     )}
                     style={{ '--team-color': colors[row.side] }}
                     onClick={onSelect && (() => onSelect(row.eventId))}
                     onPointerEnter={
                        onHover
                        && ((e: PointerEvent) => {
                           if (e.pointerType !== 'touch') onHover(row.eventId);
                        })
                     }
                     onPointerLeave={onHover && (() => onHover(undefined))}
                  >
                     <td className="why-table__wide why-table__team">{team}</td>
                     <td className="why-table__penalty">
                        <span className="why-table__narrow">{team} </span>
                        {onSelect ? (
                           <button
                              type="button"
                              className="why-table__pick"
                              aria-pressed={selected}
                              aria-label={`Select ${team} ${row.penalty}, ${row.served}`}
                           >
                              {row.penalty}
                           </button>
                        ) : (
                           row.penalty
                        )}
                        <span className="why-table__narrow why-table__served">{row.served}</span>
                     </td>
                     <td className="why-table__wide">{row.served}</td>
                     <td className="why-table__wide">{row.tag}</td>
                     <td className="why-table__why">
                        {row.tag !== undefined && (
                           <b className="why-table__narrow">{`${row.tag}. `}</b>
                        )}
                        {row.text}
                     </td>
                  </tr>
               );
            })}
         </tbody>
      </table>
   );
}

export default WhyTable;
