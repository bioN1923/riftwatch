import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { CheckCircle2, ChevronDown, EyeOff, Eye, Loader2 } from 'lucide-react';
import type { PrivacyChallenge } from '../../shared/types';
import { PLATFORMS, getPlatform } from '../../shared/regions';
import { api, ApiClientError } from '../lib/api';
import { assets, useStaticData } from '../lib/ddragon';
import { parseRiotId } from '../lib/riotId';
import { useRegion } from '../lib/storage';
import { GameImg } from '../components/ui/GameImg';
import { getLang, t } from '../i18n';

export function PrivacyPage() {
  useEffect(() => {
    document.title = t('pv.docTitle');
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }, []);
  const health = useQuery({ queryKey: ['health'], queryFn: api.health, staleTime: Infinity, retry: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-5xl font-extrabold leading-none tracking-tight">{t('pv.heading')}</h1>
      <p className="mt-3 text-muted">{t('pv.lead')}</p>

      <Visibility demo={health.data?.mode === 'demo'} />

      {getLang() !== 'en' && <p className="mt-10 rounded border border-line bg-surface px-4 py-3 text-sm text-muted">{t('pv.englishOnly')}</p>}
      <Policy contact={health.data?.contact} />
    </div>
  );
}

/* --------------------------------------------------------------- the tool */

function Visibility({ demo }: { demo: boolean }) {
  const [region] = useRegion();
  const [text, setText] = useState('');
  const [platform, setPlatform] = useState(region);
  // Arriving from a "this profile is private" message: the visitor probably wants it visible again.
  const [action, setAction] = useState<'hide' | 'show'>(location.hash === '#visibility' ? 'show' : 'hide');
  const [challenge, setChallenge] = useState<PrivacyChallenge | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const { data: sd } = useStaticData();
  const a = assets(sd);

  const start = useMutation({
    mutationFn: () => {
      const id = parseRiotId(text, getPlatform(platform)?.defaultTag ?? 'EUW');
      if (!id || !text.includes('#')) throw new ApiClientError(400, 'BAD_REQUEST', t('pv.needTag'));
      return api.privacyChallenge({ platform, gameName: id.gameName, tagLine: id.tagLine, action });
    },
    onSuccess: (c) => {
      setChallenge(c);
      setStartedAt(Date.now());
      check.reset();
    },
  });
  const check = useMutation({ mutationFn: () => api.privacyVerify({ platform, puuid: challenge!.puuid }) });
  const remaining = useCountdown(challenge ? startedAt + challenge.expiresIn : 0);
  const expired = !!challenge && remaining <= 0 && !check.data?.done;

  const errorText = (e: unknown) =>
    e instanceof ApiClientError ? (e.code === 'NOT_FOUND' ? t('pv.notFound') : e.code === 'RATE_LIMITED' ? t('pv.slowDown') : e.code === 'BAD_REQUEST' && e.message === t('pv.needTag') ? e.message : t('pv.failed')) : t('pv.failed');

  return (
    <section id="visibility" aria-labelledby="vis-h" className="panel panel-tick mt-8 scroll-mt-24 p-5 sm:p-6">
      <h2 id="vis-h" className="panel-title text-2xl">
        {t('pv.toolTitle')}
      </h2>
      <p className="mt-1 text-sm text-muted">{t('pv.toolLead')}</p>

      {!challenge || check.data?.done ? (
        <>
          {check.data?.done && (
            <p role="status" className="mt-4 flex items-start gap-2 rounded border border-win/40 bg-win/10 px-3 py-2.5 text-sm">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-win" aria-hidden />
              {check.data.hidden ? t('pv.doneHidden', { name: `${challenge!.gameName}#${challenge!.tagLine}` }) : t('pv.doneShown', { name: `${challenge!.gameName}#${challenge!.tagLine}` })}
            </p>
          )}
          <form
            className="mt-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              start.mutate();
            }}
          >
            <fieldset className="flex flex-wrap gap-2">
              <legend className="sr-only">{t('pv.choose')}</legend>
              {(['hide', 'show'] as const).map((x) => (
                <label
                  key={x}
                  className={clsx(
                    'flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-sm transition-colors',
                    action === x ? 'border-gold bg-gold/10 text-text' : 'border-line text-muted hover:text-text',
                  )}
                >
                  <input type="radio" name="action" value={x} checked={action === x} onChange={() => setAction(x)} className="sr-only" />
                  {x === 'hide' ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                  {x === 'hide' ? t('pv.hide') : t('pv.show')}
                </label>
              ))}
            </fieldset>
            <div className="flex gap-2">
              <label className="min-w-0 flex-1">
                <span className="mb-1 block text-xs text-muted">{t('pv.riotId')}</span>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t('cmp.placeholder')}
                  spellCheck={false}
                  autoComplete="off"
                  required
                  className="h-10 w-full rounded border border-line bg-surface px-3 text-sm outline-none placeholder:text-faint focus:border-gold"
                />
              </label>
              <label className="relative w-24 shrink-0">
                <span className="mb-1 block text-xs text-muted">{t('ms.region')}</span>
                <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="h-10 w-full appearance-none rounded border border-line bg-surface px-3 font-display text-lg font-bold">
                  {PLATFORMS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute bottom-3 right-2.5 size-4 text-muted" aria-hidden />
              </label>
            </div>
            <button type="submit" disabled={start.isPending || !text.trim()} className="flex h-10 items-center gap-2 rounded bg-gold px-5 font-semibold text-gold-ink transition hover:brightness-110 disabled:opacity-40">
              {start.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {t('pv.start')}
            </button>
            {start.isError && <p className="text-sm text-loss">{errorText(start.error)}</p>}
          </form>
        </>
      ) : (
        <div className="mt-5">
          {challenge.action === 'hide' && challenge.hidden ? (
            <p className="mb-4 text-sm text-muted">{t('pv.alreadyHidden')}</p>
          ) : challenge.action === 'show' && !challenge.hidden ? (
            <p className="mb-4 text-sm text-muted">{t('pv.alreadyShown')}</p>
          ) : null}
          <ol className="space-y-4 text-sm">
            <Step n={1}>
              <p>{t('pv.step1', { name: `${challenge.gameName}#${challenge.tagLine}` })}</p>
              <div className="mt-3 flex items-center gap-4">
                <GameImg src={a.profileIcon(challenge.iconId)} alt={t('pv.iconAlt', { id: challenge.iconId })} size={72} rounded="md" className="ring-2 ring-gold" />
                <p className="text-muted">{t('pv.iconHelp')}</p>
              </div>
            </Step>
            <Step n={2}>
              <p>{t('pv.step2')}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => check.mutate()}
                  disabled={check.isPending || expired}
                  className="flex h-10 items-center gap-2 rounded bg-gold px-5 font-semibold text-gold-ink transition hover:brightness-110 disabled:opacity-40"
                >
                  {check.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                  {t('pv.check')}
                </button>
                <span className="num text-xs text-muted" aria-live="off">
                  {expired ? t('pv.expired') : t('pv.timeLeft', { time: `${Math.floor(remaining / 60_000)}:${String(Math.floor((remaining % 60_000) / 1000)).padStart(2, '0')}` })}
                </span>
                {demo && (
                  <button onClick={() => api.demoSetIcon(challenge.puuid, challenge.iconId)} className="text-xs text-muted underline hover:text-text">
                    {t('pv.demoSet')}
                  </button>
                )}
              </div>
              <div aria-live="polite" className="mt-2 text-sm">
                {check.data && !check.data.done && <p className="text-loss">{t('pv.notYet')}</p>}
                {check.isError && <p className="text-loss">{errorText(check.error)}</p>}
              </div>
            </Step>
          </ol>
          <button
            onClick={() => {
              setChallenge(null);
              check.reset();
            }}
            className="mt-5 text-sm text-muted underline hover:text-text"
          >
            {expired ? t('pv.again') : t('pv.cancel')}
          </button>
        </div>
      )}
      <p className="mt-6 border-t border-line pt-4 text-xs text-faint">{t('pv.what')}</p>
    </section>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[28px_minmax(0,1fr)] gap-3">
      <span className="grid size-7 place-items-center rounded-full border border-gold/60 font-display font-bold text-gold">{n}</span>
      <div className="pt-0.5">{children}</div>
    </li>
  );
}

function useCountdown(until: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!until) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [until]);
  return Math.max(0, until - now);
}

/* ---------------------------------------------------- the policy (English) */

function Policy({ contact }: { contact?: string }) {
  const H = ({ children }: { children: ReactNode }) => <h2 className="mt-10 font-display text-2xl font-bold">{children}</h2>;
  const P = ({ children }: { children: ReactNode }) => <p className="mt-3 leading-relaxed text-muted">{children}</p>;
  return (
    <article lang="en" className="mt-4 [&_li]:mt-1.5 [&_strong]:text-text">
      <H>Privacy policy</H>
      <P>
        Riftwatch shows League of Legends statistics from the Riot Games API. This page explains what we store, for how long, and how you can hide your
        profile. Last updated 7 November 2026.
      </P>

      <H>No accounts, no tracking</H>
      <P>
        You don’t sign up or log in, and we don’t use tracking cookies, analytics or advertising networks. If advertising is added later, you will be asked
        for consent first and this page will be updated.
      </P>

      <H>What we store on our server</H>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-muted">
        <li>
          <strong>Riot API responses</strong>, cached so we don’t ask Riot again on every page view: account and mastery 30 minutes, rank 2 minutes, profile
          5 minutes, match lists 2 minutes, live games 30 seconds. Finished matches never change, so they are kept on disk (up to 20,000, oldest removed first).
          See <Link to="/api-usage" className="text-gold underline underline-offset-2">how we use the Riot API</Link>.
        </li>
        <li>
          <strong>A search index</strong> of players who have appeared on the site (Riot ID, region, profile icon, level and rank), so search can suggest
          names.
        </li>
        <li>
          <strong>Rank history</strong>: a snapshot of a player’s rank when it changes, kept up to 400 points per player.
        </li>
        <li>
          <strong>Champion statistics</strong>: totals per champion (win rates, builds, runes). These don’t identify anyone, except the “who plays it most”
          list, which names players with public games on that champion.
        </li>
        <li>
          <strong>Error reports</strong> when a page crashes: the error message, the page address and the browser version. No IP addresses or personal
          details.
        </li>
      </ul>
      <P>
        Our host (Fly.io) keeps standard server logs, which include IP addresses, for a short time. We don’t use them for anything else, and we never sell or
        share data.
      </P>

      <H>What stays in your browser</H>
      <P>
        Your language, theme, region, starred players and recent searches are saved in your browser’s local storage. They never leave your device, and you
        can clear them in your browser settings.
      </P>

      <H>Hiding your profile</H>
      <P>
        All data shown is public game data from Riot. If you don’t want your profile on Riftwatch, use the tool at the top of this page. Once hidden: your
        profile page and match history can’t be opened, your name is removed from other players’ games, live games, the ladder and search, and we delete the
        rank history, search entry and champion-list entries we stored for you. You can make it visible again the same way. If we add accounts in the future,
        we will use Riot Sign-On (RSO) and you’ll be able to do this by signing in. Data deletion requests made to Riot Games and passed on to us are
        carried out the same way. Custom games are never shown publicly.
      </P>

      <H>Contact</H>
      <P>
        {contact ? (
          <>
            For any privacy or data request, email <a href={`mailto:${contact}`} className="text-gold underline underline-offset-2">{contact}</a>. We reply within 30 days.
          </>
        ) : (
          <>For any privacy or data request, use the tool above, or contact the site owner.</>
        )}
      </P>

    </article>
  );
}
