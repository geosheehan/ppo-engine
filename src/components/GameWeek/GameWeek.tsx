import '@components/GameWeek/GameWeek.css';
import { Suspense, use, useEffect, useId, useRef, useState } from 'react';
import { clsx } from 'clsx';
import ErrorBoundary from '@components/ErrorBoundary';
import SeasonCalendar from '@components/SeasonCalendar';
import { ppoApi } from '@api/ppoApi';
import {
   addDays,
   defaultPickerWeek,
   gameStatusLabel,
   isPickable,
   longDayLabel,
   monthDayLabel,
   pickerDay,
   weekDates,
   weekdayLabel,
   weekRangeLabel,
   weekStartOf,
} from '@layout/gamePicker';
import { TEAM_COLORS } from '@domain/teamColors';
import type { ScheduleGame, ScheduleTeam } from '@domain/types';

const FETCH_DELAY_MS = 300;

type GameWeekProps = {
   initialDate?: string;
   selectedId?: string;
   onPick: (id: string) => void;
};

type Shown = { weekStart: string; day?: string };

function GameWeek({ initialDate, selectedId, onPick }: GameWeekProps) {
   const [shown, setShown] = useState<Shown>(() =>
      initialDate === undefined
         ? { weekStart: defaultPickerWeek(new Date()) }
         : { weekStart: weekStartOf(initialDate), day: initialDate },
   );
   const [fetchedWeek, setFetchedWeek] = useState(shown.weekStart);
   const jumpId = useId();
   const jumpRef = useRef<HTMLDivElement>(null);
   const [jumpOpen, setJumpOpen] = useState(false);

   useEffect(() => {
      const timer = setTimeout(() => setFetchedWeek(shown.weekStart), FETCH_DELAY_MS);
      return () => clearTimeout(timer);
   }, [shown.weekStart]);

   const moveWeek = (weeks: number) =>
      setShown(({ weekStart, day }) => ({
         weekStart: addDays(weekStart, 7 * weeks),
         day: day === undefined ? undefined : addDays(day, 7 * weeks),
      }));
   const pickDay = (day: string) => setShown({ weekStart: shown.weekStart, day });
   const jumpTo = (day: string) => {
      jumpRef.current?.hidePopover();
      setShown({ weekStart: weekStartOf(day), day });
   };
   const waiting = (
      <>
         <DayStrip weekStart={shown.weekStart} selectedDay={shown.day} onDay={pickDay} />
         <p className="game-week__message">Loading games…</p>
      </>
   );

   return (
      <div className="game-week">
         <div className="game-week__header">
            <button
               type="button"
               className="game-week__arrow"
               aria-label="Previous week"
               onClick={() => moveWeek(-1)}
            >
               ‹
            </button>
            <button type="button" className="game-week__range" popoverTarget={jumpId}>
               {weekRangeLabel(shown.weekStart)}
               <span aria-hidden="true">▾</span>
            </button>
            <div
               ref={jumpRef}
               id={jumpId}
               popover="auto"
               role="dialog"
               aria-label="Jump to a date"
               className="game-week__jump"
               onToggle={(event) => setJumpOpen(event.newState === 'open')}
            >
               {jumpOpen && <SeasonCalendar date={shown.day ?? shown.weekStart} onPick={jumpTo} />}
            </div>
            <button
               type="button"
               className="game-week__arrow"
               aria-label="Next week"
               onClick={() => moveWeek(1)}
            >
               ›
            </button>
         </div>
         {fetchedWeek === shown.weekStart ? (
            <ErrorBoundary
               key={fetchedWeek}
               fallback={(error, retry) => (
                  <>
                     <DayStrip
                        weekStart={shown.weekStart}
                        selectedDay={shown.day}
                        onDay={pickDay}
                     />
                     <div className="game-week__message" role="alert">
                        <p>Couldn't load this week. {error.message}</p>
                        <button type="button" onClick={retry}>
                           Try again
                        </button>
                     </div>
                  </>
               )}
               onRetry={() => ppoApi.forgetSchedule(fetchedWeek)}
            >
               <Suspense fallback={waiting}>
                  <WeekGames
                     weekStart={fetchedWeek}
                     day={shown.day}
                     selectedId={selectedId}
                     onDay={pickDay}
                     onPick={onPick}
                  />
               </Suspense>
            </ErrorBoundary>
         ) : (
            waiting
         )}
      </div>
   );
}

type WeekGamesProps = {
   weekStart: string;
   day?: string;
   selectedId?: string;
   onDay: (day: string) => void;
   onPick: (id: string) => void;
};

function WeekGames({ weekStart, day, selectedId, onDay, onPick }: WeekGamesProps) {
   const week = use(ppoApi.getSchedule(weekStart));
   const shownDay = pickerDay(week, day);
   const counts = new Map(week.days.map(({ date, games }) => [date, games.length]));
   const games = week.days.find(({ date }) => date === shownDay)?.games ?? [];

   return (
      <>
         <DayStrip weekStart={weekStart} selectedDay={shownDay} counts={counts} onDay={onDay} />
         {games.length === 0 ? (
            <p className="game-week__message">No games on {longDayLabel(shownDay)}.</p>
         ) : (
            <ul className="game-week__cards">
               {games.map((game) => (
                  <li key={game.id}>
                     <GameCard
                        game={game}
                        selected={String(game.id) === selectedId}
                        onPick={onPick}
                     />
                  </li>
               ))}
            </ul>
         )}
      </>
   );
}

type DayStripProps = {
   weekStart: string;
   selectedDay?: string;
   counts?: Map<string, number>;
   onDay: (day: string) => void;
};

function DayStrip({ weekStart, selectedDay, counts, onDay }: DayStripProps) {
   return (
      <ol className="game-week__days">
         {weekDates(weekStart).map((date) => {
            const count = counts?.get(date) ?? 0;
            return (
               <li key={date}>
                  <button
                     type="button"
                     className={clsx(
                        'game-week__day',
                        date === selectedDay && 'game-week__day--selected',
                        counts !== undefined && count === 0 && 'game-week__day--empty',
                     )}
                     aria-pressed={date === selectedDay}
                     onClick={() => onDay(date)}
                  >
                     <span className="game-week__weekday">{weekdayLabel(date)}</span>
                     <span className="game-week__date">{monthDayLabel(date)}</span>
                     <span className="game-week__count">
                        {counts === undefined ? ' ' : `${count} ${count === 1 ? 'game' : 'games'}`}
                     </span>
                  </button>
               </li>
            );
         })}
      </ol>
   );
}

type GameCardProps = {
   game: ScheduleGame;
   selected: boolean;
   onPick: (id: string) => void;
};

function GameCard({ game, selected, onPick }: GameCardProps) {
   const { awayTeam, homeTeam } = game;
   return (
      <button
         type="button"
         className={clsx('game-card', selected && 'game-card--selected')}
         disabled={!isPickable(game)}
         aria-current={selected ? 'true' : undefined}
         onClick={() => onPick(String(game.id))}
      >
         <TeamLine team={awayTeam} won={beats(awayTeam, homeTeam)} />
         <TeamLine team={homeTeam} won={beats(homeTeam, awayTeam)} />
         <span className="game-card__status">{gameStatusLabel(game)}</span>
      </button>
   );
}

const beats = (team: ScheduleTeam, other: ScheduleTeam) =>
   team.score !== undefined && other.score !== undefined && team.score > other.score;

function TeamLine({ team, won }: { team: ScheduleTeam; won: boolean }) {
   return (
      <span
         className={clsx('game-card__team', won && 'game-card__team--won')}
         style={{ '--team-color': TEAM_COLORS[team.abbrev]?.[0] ?? 'var(--border)' }}
      >
         <span className="game-card__abbrev">{team.abbrev}</span>
         {team.score !== undefined && <span className="game-card__score">{team.score}</span>}
      </span>
   );
}

export default GameWeek;
