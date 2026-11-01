import { useRef, useState } from 'react';
import clsx from 'clsx';
import type { MatchSummary } from '../../../shared/types';
import { PostGame } from './details/PostGame';
import { Performance } from './details/Performance';
import { ItemBuild } from './details/ItemBuild';
import { TimelineTab } from './details/TimelineTab';
import { Metrics } from './details/Metrics';
import { SlidingIndicator, useSlideDirection } from '../ui/Motion';

const TABS = [
  { id: 'post', label: 'Post game' },
  { id: 'performance', label: 'Performance' },
  { id: 'build', label: 'Item build' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'metrics', label: 'Metrics' },
] as const;
type TabId = (typeof TABS)[number]['id'];

export function MatchDetails({ match, puuid, platform }: { match: MatchSummary; puuid: string; platform: string }) {
  const [tab, setTab] = useState<TabId>('post');
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const base = `md-${match.id}`;
  const dir = useSlideDirection(TABS.findIndex((t) => t.id === tab));

  function onKey(e: React.KeyboardEvent, i: number) {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (i + dir + TABS.length) % TABS.length;
    setTab(TABS[next].id);
    refs.current[next]?.focus();
  }

  return (
    <div className="border-t border-line-strong bg-bg/40">
      <div role="tablist" aria-label="Game details" className="relative flex gap-1 overflow-x-auto border-b border-line px-3">
        <SlidingIndicator />
        {TABS.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            id={`${base}-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`${base}-panel`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={clsx(
              'relative whitespace-nowrap px-3 py-2.5 font-display text-base font-bold tracking-wide transition-colors',
              tab === t.id ? 'text-text' : 'text-muted hover:text-text',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div key={tab} role="tabpanel" id={`${base}-panel`} aria-labelledby={`${base}-tab-${tab}`} className="tab-in" style={{ '--dir': dir } as React.CSSProperties}>
        {tab === 'post' && <PostGame match={match} puuid={puuid} platform={platform} />}
        {tab === 'performance' && <Performance match={match} puuid={puuid} />}
        {tab === 'build' && <ItemBuild match={match} puuid={puuid} platform={platform} />}
        {tab === 'timeline' && <TimelineTab match={match} puuid={puuid} platform={platform} />}
        {tab === 'metrics' && <Metrics match={match} puuid={puuid} platform={platform} />}
      </div>
    </div>
  );
}
