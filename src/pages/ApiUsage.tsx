import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router';
import { getLang, t } from '../i18n';

/**
 * How Riftwatch uses the Riot API: caching, rate limits, privacy. Written for Riot's reviewers
 * and anyone curious, and kept in sync with server/riot.ts.
 */
const CACHE: [string, string, string][] = [
  ['account-v1 (Riot ID → account)', '30 minutes', 'Names rarely change. Ladder names by PUUID: 24 hours.'],
  ['summoner-v4 (icon, level)', '5 minutes', ''],
  ['league-v4 (rank)', '2 minutes', 'Ladder pages (Challenger, Grandmaster, Master): 10 minutes. One page of a lower tier, read now and then by the collector to find Arena players: 30 minutes. Challenger and Grandmaster LP are kept hourly for two days (from reads that happen anyway) to show LP changes.'],
  ['champion-mastery-v4', '30 minutes', ''],
  ['lol-challenges-v1 (player challenges)', '30 minutes', 'Only the overall level, points and percentile are shown, on profiles.'],
  ['match-v5 match IDs', '2 minutes', ''],
  ['match-v5 match', 'Permanent (on disk)', 'Finished matches never change; each is downloaded once. Up to 20,000 kept, least recently used removed first.'],
  ['match-v5 timeline', '6 hours (processed form)', 'Only when someone opens a game’s details.'],
  ['spectator-v5 (live game)', '30 seconds', 'Checked when a profile is opened, then once a minute only while its Live tab is open. Never polled in the background.'],
  ['lol-status-v4, champion-v3', '5 minutes / 1 hour', ''],
];

export function ApiUsagePage() {
  useEffect(() => {
    document.title = 'How Riftwatch uses the Riot API · Riftwatch';
  }, []);
  const H = ({ id, children }: { id?: string; children: ReactNode }) => (
    <h2 id={id} className="mt-10 scroll-mt-24 font-display text-2xl font-bold">
      {children}
    </h2>
  );
  const P = ({ children }: { children: ReactNode }) => <p className="mt-3 leading-relaxed text-muted">{children}</p>;
  const L = ({ children }: { children: ReactNode }) => <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed text-muted">{children}</ul>;

  return (
    <article lang="en" className="mx-auto max-w-3xl px-4 py-8 [&_strong]:text-text">
      <h1 className="font-display text-5xl font-extrabold leading-none tracking-tight">How we use the Riot API</h1>
      {getLang() !== 'en' && <p className="mt-4 rounded border border-line bg-surface px-4 py-3 text-sm text-muted">{t('pv.englishOnly')}</p>}
      <P>
        Riftwatch is a League of Legends stats site: player profiles with rank, match history and champion stats; live-game scouting; a champion tier list
        with builds, runes and matchups; draft helpers; the ranked ladder; and player comparison. Everything comes from the Riot Games API plus Data Dragon. This page
        describes how the site keeps its API use light, how it handles rate limits, and how players control their data.
      </P>

      <H id="caching">Caching</H>
      <P>
        Every Riot response is cached on the server, so refreshing a page or many visitors opening the same profile doesn’t reach Riot again. Opening a
        profile asks Riot for fresh data <strong>at most once every 3 minutes per player</strong> (the Update button has the same limit). This is enforced on
        the server, not in the browser; within those 3 minutes everyone gets the cached copy.
      </P>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th scope="col" className="py-2 pr-3 font-medium">
                Endpoint
              </th>
              <th scope="col" className="py-2 pr-3 font-medium">
                Cached for
              </th>
              <th scope="col" className="py-2 font-medium">
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {CACHE.map(([e, ttl, note]) => (
              <tr key={e} className="border-t border-line align-top">
                <td className="py-2 pr-3 font-medium">{e}</td>
                <td className="py-2 pr-3 whitespace-nowrap">{ttl}</td>
                <td className="py-2 text-muted">{note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <P>
        Browsers also keep results for 1–2 minutes, so moving between tabs doesn’t repeat requests. Champion statistics, the player search index and rank
        history are computed from these responses and stored on our server’s disk, so they survive restarts without re-downloading anything.
      </P>

      <H id="rate-limits">Rate limits</H>
      <L>
        <li>
          Requests wait in a queue per region and per endpoint, sized to the key’s real limits as Riot reports them in <code>X-App-Rate-Limit</code> and{' '}
          <code>X-Method-Rate-Limit</code> (we use 90%, leaving headroom). Bursts are smoothed out instead of failing.
        </li>
        <li>
          On a <strong>429</strong>, we honour <code>Retry-After</code>: the whole region (or that endpoint, for method limits) pauses for that long, so
          every queued request waits, not just the one that failed. Without a <code>Retry-After</code> we back off exponentially with jitter (about 1 s,
          2 s, 4 s), up to 4 attempts.
        </li>
        <li>
          Riot <strong>5xx</strong> errors and timeouts are retried with exponential backoff too, at most twice.
        </li>
        <li>
          If a visitor’s request would have to wait more than 10 seconds, we answer “try again in N seconds” instead of piling requests up.
        </li>
        <li>
          Background work only runs when visitors are idle: the champion-stats collector (high-elo ranked games, paced 2.5 s apart) pauses whenever someone
          is using the site, and rank tracking for starred players runs every 20 minutes. For the Arena list, when it has no Arena players lined up, the
          collector asks a handful of players from one page of an everyday tier for recent Arena games, at most every 15 minutes (about ten requests).
        </li>
        <li>Rate-limit errors and an expired or rejected key are logged and alert the site owner.</li>
        <li>
          Our own API serves only our pages: each visitor is limited to 150 requests a minute, so the site can’t be used to scrape or resell Riot data.
        </li>
      </L>

      <H id="privacy">Privacy</H>
      <P>
        Only public game data is shown, and players can hide their profile at any time on the{' '}
        <Link to="/privacy#visibility" className="text-gold underline underline-offset-2">
          privacy page
        </Link>
        . They prove the account is theirs by equipping a starter profile icon we name, which we read back from summoner-v4. A hidden profile can’t be
        opened; the player’s name is removed from other people’s games, live games, the ladder and search; and the data we stored about them (rank history,
        search entry, champion-list entries) is deleted. The site has no accounts or logins. If we add any feature that needs a player to sign in, it will
        use Riot Sign-On (RSO). Full details:{' '}
        <Link to="/privacy" className="text-gold underline underline-offset-2">
          privacy policy
        </Link>
        .
      </P>

      <H id="policies">Riot policies</H>
      <L>
        <li>No MMR or hidden-rating estimates, and no negative labels on players.</li>
        <li>
          Live games show only public profile data (rank, champion mastery, ranked record). No session-specific information such as premade groups, and
          players the game hides (e.g. streamer mode) are not looked up.
        </li>
        <li>Arena: no win rates for augments or Arena items. Augments appear only as what a player picked in their own games (names and icons from CommunityDragon); items show only how often they’re bought.</li>
        <li>Custom games (queue 0) are never shown in public match history.</li>
        <li>Players are shown by their current Riot ID only; an old Riot ID is dropped from search as soon as we see the new one.</li>
        <li>Multi-search only looks up Riot IDs the visitor types or pastes. It never reveals the names ranked champion select hides.</li>
        <li>
          Multi-search&rsquo;s &ldquo;Premade with&rdquo; tags come only from public match history (the same recent games anyone can open on those players&rsquo;
          profiles), never from the lobby or a live game. The live game view doesn&rsquo;t mark premades.
        </li>
        <li>
          The duo finder only looks at players who were in the visitor&rsquo;s own recent ranked games, and only shows those around the same rank. It
          never searches or ranks the wider player base, and hidden profiles are left out.
        </li>
        <li>
          The draft helpers (lane draft and team draft) work only from champion picks the visitor enters, or the champion picks already visible in a
          live game, plus win rates aggregated from games the site has already read. Apart from the optional &ldquo;Fill from a Riot ID&rdquo; pool import, which reads
          that player&rsquo;s recent games just like opening their profile, they make no Riot API requests, show no player names, and never infer
          premades or any other lobby information.
        </li>
        <li>Deletion requests that Riot forwards are handled by deleting the player’s stored data (search entry, rank history, champion lists).</li>
        <li>The site is free. If ads are added, they will follow Riot’s monetisation rules and ask visitors for consent first.</li>
      </L>

    </article>
  );
}
