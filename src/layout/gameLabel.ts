const DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
   month: 'short',
   day: 'numeric',
   year: 'numeric',
   timeZone: 'UTC',
});

export const gameLabel = ({ date, away, home }: { date: string; away: string; home: string }) =>
   `${DATE_FORMAT.format(new Date(`${date}T00:00:00Z`))} · ${away} @ ${home}`;
