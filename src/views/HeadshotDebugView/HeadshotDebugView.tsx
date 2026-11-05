import '@views/HeadshotDebugView/HeadshotDebugView.css';
import { use, useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { useHeadshot } from '@hooks/useHeadshot';
import placeholderHeadshot from '@assets/placeholder-headshot.png';
import { headshotSamples } from '@api/headshotSamples';
import { colorDistance } from '@domain/colors';
import { DEFAULT_TEAM_COLORS } from '@domain/constants';
import { TEAM_COLORS } from '@domain/teamColors';
import type { Player } from '@domain/types';

type Shade = 'white' | 'black';

// label identifies the option in saved votes; voters only see "Option N". rule goes in the saved file.
type Variant = {
   label: string;
   rule: string;
   shade: Shade;
   halo: boolean;
};

const VARIANTS: Variant[] = [
   {
      label: 'Halo + white shade',
      rule: 'Halo (dark shadow, 1px down, 2px blur, 60%); selected color fading 50% toward white at the bottom',
      shade: 'white',
      halo: true,
   },
   {
      label: 'Halo + shade gradient',
      rule: 'Halo (dark shadow, 1px down, 2px blur, 60%); selected color fading 55% toward black at the bottom',
      shade: 'black',
      halo: true,
   },
];

// background is the color showing when the vote was cast.
type Vote = { option: string; background: string };
type Votes = Partial<Record<string, Vote[]>>;
// Clicking the current swatch swaps back to previous; both start at the team's first color.
type Pick = { current: string; previous: string };
type Picks = Partial<Record<string, Pick>>;

const VOTES_KEY = 'headshot-debug-votes';
const PICKS_KEY = 'headshot-debug-backgrounds';
const VOTER_KEY = 'headshot-debug-voter';
const NONE = 'None of these';

const optionName = (option: string): string => {
   const index = VARIANTS.findIndex((variant) => variant.label === option);
   return index === -1 ? option : `Option ${index + 1}`;
};

const fileSlug = (text: string) =>
   text
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
const WHITE = '#FFFFFF';
const EXTRA_COLORS = [WHITE, '#000000'];
// #010101 counts as the team already having black; navy (#001425 and up) doesn't.
const SAME_COLOR_DISTANCE = 0.1;

function load<T>(key: string): T | undefined {
   try {
      return JSON.parse(localStorage.getItem(key) ?? 'null') as T | undefined;
   } catch {
      return undefined;
   }
}

function save(key: string, value: unknown) {
   try {
      localStorage.setItem(key, JSON.stringify(value));
   } catch {
      // It just won't survive a reload.
   }
}

const paletteFor = (abbrev: string) => TEAM_COLORS[abbrev] ?? [DEFAULT_TEAM_COLORS.HOME];

const firstColor = (abbrev: string) => paletteFor(abbrev)[0];

const currentColor = (picks: Picks, abbrev: string) => picks[abbrev]?.current ?? firstColor(abbrev);

// Older saves stored a team's pick as a plain color.
function loadPicks(): Picks {
   const stored = load<Partial<Record<string, Pick | string>>>(PICKS_KEY) ?? {};
   return Object.fromEntries(
      Object.entries(stored).map(([abbrev, pick]) => [
         abbrev,
         typeof pick === 'string' ? { current: pick, previous: firstColor(abbrev) } : pick,
      ]),
   );
}

// Votes for options that have since been removed are dropped.
const isCurrentOption = (option: string) =>
   option === NONE || VARIANTS.some((variant) => variant.label === option);

type StoredVote = string | Vote | { option: string; picked: string | null };

// Older saves stored plain option names, or { option, picked } where null meant the first color.
// Both now become the actual color, which can turn two copies of one vote into duplicates.
function loadVotes(picks: Picks): Votes {
   const stored = load<Partial<Record<string, StoredVote[]>>>(VOTES_KEY) ?? {};
   return Object.fromEntries(
      Object.entries(stored).map(([abbrev, votes = []]) => {
         const converted = votes.map((vote): Vote => {
            if (typeof vote === 'string') {
               return { option: vote, background: currentColor(picks, abbrev) };
            }
            if ('background' in vote) return vote;
            return { option: vote.option, background: vote.picked ?? firstColor(abbrev) };
         });
         const unique = converted.filter(
            (vote, index) =>
               isCurrentOption(vote.option)
               && converted.findIndex(
                  (other) => other.option === vote.option && other.background === vote.background,
               ) === index,
         );
         return [abbrev, unique];
      }),
   );
}

function DebugCard({
   player,
   teamColor,
   background,
   variant,
}: {
   player: Player;
   teamColor: string;
   background: string;
   variant: Variant;
}) {
   const headshot = useHeadshot(player.headshot);
   const accent = background !== teamColor ? teamColor : undefined;
   const [enlarged, setEnlarged] = useState(false);
   const name = `#${player.sweaterNumber} ${player.lastName.default}`;

   return (
      <div className={clsx('headshot-debug__card', enlarged && 'headshot-debug__card--enlarged')}>
         <button
            type="button"
            aria-pressed={enlarged}
            aria-label={`${enlarged ? 'Shrink' : 'Enlarge'} ${name}`}
            onClick={() => setEnlarged((previous) => !previous)}
            className={clsx(
               'headshot-debug__frame',
               `headshot-debug__frame--shade-${variant.shade}`,
               accent !== undefined && 'headshot-debug__frame--accent',
            )}
            style={{
               '--team-color': background,
               '--headshot-accent': accent,
            }}
         >
            <img
               className={clsx(
                  'headshot-debug__headshot',
                  variant.halo && 'headshot-debug__headshot--halo',
               )}
               src={headshot ?? placeholderHeadshot}
               alt=""
            />
         </button>
      </div>
   );
}

// Temporary page for comparing headshot backgrounds side by side.
function HeadshotDebugView() {
   const samples = use(headshotSamples());
   const [picks, setPicks] = useState<Picks>(loadPicks);
   const [votes, setVotes] = useState<Votes>(() => loadVotes(picks));
   const [voter, setVoter] = useState(() => load<string>(VOTER_KEY) ?? '');
   const [saveStatus, setSaveStatus] = useState<string>();

   useEffect(() => save(VOTES_KEY, votes), [votes]);
   useEffect(() => save(PICKS_KEY, picks), [picks]);
   useEffect(() => save(VOTER_KEY, voter), [voter]);

   const chooseColor = (abbrev: string, color: string) =>
      setPicks((previous) => {
         const first = firstColor(abbrev);
         const pick = previous[abbrev] ?? { current: first, previous: first };
         const next =
            color === pick.current
               ? { current: pick.previous, previous: pick.current }
               : { current: color, previous: pick.current };
         return { ...previous, [abbrev]: next };
      });

   const isVote = (vote: Vote, option: string, background: string) =>
      vote.option === option && vote.background === background;

   // Votes belong to the background they were cast with. Within one background, "None of these"
   // and a variant vote rule each other out.
   const toggleVote = (abbrev: string, option: string) =>
      setVotes((previous) => {
         const background = currentColor(picks, abbrev);
         const team = previous[abbrev] ?? [];
         if (team.some((vote) => isVote(vote, option, background))) {
            return {
               ...previous,
               [abbrev]: team.filter((vote) => !isVote(vote, option, background)),
            };
         }
         const kept = team.filter(
            (vote) =>
               vote.background !== background || (option === NONE ? false : vote.option !== NONE),
         );
         return { ...previous, [abbrev]: [...kept, { option, background }] };
      });

   const voteBox = (abbrev: string, option: string, text: string) => (
      <label key={option} className="headshot-debug__vote">
         <input
            type="checkbox"
            checked={
               votes[abbrev]?.some((vote) => isVote(vote, option, currentColor(picks, abbrev)))
               === true
            }
            onChange={() => toggleVote(abbrev, option)}
         />
         {text}
      </label>
   );

   const tally = (option: string) =>
      Object.values(votes).filter((team) => team?.some((vote) => vote.option === option) === true)
         .length;

   const saveVotes = () => {
      const variantFor = (option: string) => VARIANTS.find((variant) => variant.label === option);
      const teams = samples.map(({ abbrev }) => ({
         team: abbrev,
         votes: (votes[abbrev] ?? []).map(({ option, background }) => {
            const variant = variantFor(option);
            if (variant === undefined) return { option, background };
            return {
               option: optionName(option),
               optionId: option,
               rule: variant.rule,
               background,
               shade: variant.shade,
               halo: variant.halo,
            };
         }),
      }));
      const counts = Object.fromEntries(
         [...VARIANTS.map((variant) => variant.label), NONE].map((option) => [
            optionName(option),
            tally(option),
         ]),
      );
      const savedAt = new Date().toISOString();
      const file = new Blob(
         [JSON.stringify({ voter: voter.trim(), savedAt, counts, teams }, null, 3)],
         { type: 'application/json' },
      );
      const name = fileSlug(voter);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(file);
      link.download = `headshot-votes-${name === '' ? '' : `${name}-`}${savedAt.replace(/[:.]/g, '-')}.json`;
      link.click();
      URL.revokeObjectURL(link.href);
      setSaveStatus(`Downloaded ${link.download}`);
   };

   return (
      <div className="headshot-debug">
         <h2>Headshot background vote</h2>
         <div className="headshot-debug__instructions">
            <p>
               Help pick which headshot looks better. Each team below shows five of its players. For
               each team:
            </p>
            <ol>
               <li>
                  Choose a background with the color squares next to the team name. Double clicking
                  the outlined square switches back to the color you had before, so you can flip
                  between two colors to compare them.
               </li>
               <li>Click any photo to see it larger, and click it again to shrink it.</li>
               <li>
                  Tick <strong>Vote</strong> under each option you like with that background. You
                  can vote for more than one option.
               </li>
               <li>If none of them look right with that background, tick {NONE}.</li>
               <li>
                  Votes belong to the background they were cast on, so you can vote for each
                  background color. Votes on other colors are listed under the team name.
               </li>
            </ol>
            <p>
               When you're done, enter your name and click <strong>Save votes</strong>. Then send
               the json file back to medium_fry on discord.
            </p>
            <label className="headshot-debug__voter">
               Your name
               <input
                  type="text"
                  value={voter}
                  onChange={(event) => setVoter(event.target.value)}
               />
            </label>
         </div>
         {saveStatus !== undefined && <p className="headshot-debug__status">{saveStatus}</p>}
         <div className="headshot-debug__grid headshot-debug__grid--header">
            <div className="headshot-debug__actions">
               <button type="button" onClick={saveVotes}>
                  Save votes
               </button>
               <button
                  type="button"
                  onClick={() => {
                     setVotes({});
                     setPicks({});
                  }}
               >
                  Clear votes
               </button>
            </div>
            {VARIANTS.map((variant) => (
               <strong key={variant.label}>{optionName(variant.label)}</strong>
            ))}
            <strong>{NONE}</strong>
         </div>
         {samples.map(({ abbrev, players }) => {
            const palette = paletteFor(abbrev);
            const current = currentColor(picks, abbrev);
            const otherVotes = (votes[abbrev] ?? []).filter((vote) => vote.background !== current);
            const swatches = [
               ...palette,
               ...EXTRA_COLORS.filter((extra) =>
                  palette.every((color) => colorDistance(color, extra) >= SAME_COLOR_DISTANCE),
               ),
            ];
            const previousColor = picks[abbrev]?.previous ?? palette[0];
            return (
               <section key={abbrev} className="headshot-debug__team">
                  <div className="headshot-debug__grid headshot-debug__team-row">
                     <h3>
                        {abbrev}
                        {swatches.map((color) => (
                           <button
                              key={color}
                              type="button"
                              className={clsx(
                                 'headshot-debug__swatch',
                                 color === current && 'headshot-debug__swatch--picked',
                              )}
                              style={{ '--swatch-color': color }}
                              title={
                                 color === current && previousColor !== current
                                    ? `${color} (click to switch back to ${previousColor})`
                                    : color
                              }
                              aria-label={`Use ${color} as the ${abbrev} background`}
                              aria-pressed={color === current}
                              onClick={() => chooseColor(abbrev, color)}
                           />
                        ))}
                     </h3>
                     {VARIANTS.map((variant) => voteBox(abbrev, variant.label, 'Vote'))}
                     {voteBox(abbrev, NONE, NONE)}
                  </div>
                  {otherVotes.length > 0 && (
                     <div className="headshot-debug__other-votes">
                        Also voted:{' '}
                        {otherVotes
                           .map(
                              ({ option, background }) => `${optionName(option)} on ${background}`,
                           )
                           .join(', ')}
                     </div>
                  )}
                  {players.map((player) => (
                     <div key={player.playerId} className="headshot-debug__grid">
                        <div className="headshot-debug__player">
                           <span className="headshot-debug__position">{player.positionCode}</span>
                           <span className="headshot-debug__name">
                              #{player.sweaterNumber} {player.lastName.default}
                           </span>
                        </div>
                        {VARIANTS.map((variant) => (
                           <DebugCard
                              key={variant.label}
                              player={player}
                              teamColor={palette[0]}
                              background={current}
                              variant={variant}
                           />
                        ))}
                     </div>
                  ))}
               </section>
            );
         })}
      </div>
   );
}

export default HeadshotDebugView;
