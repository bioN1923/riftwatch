import { useRef, useState } from 'react';
import clsx from 'clsx';
import type { MatchSummary } from '../../../shared/types';
import { PostGame } from './details/PostGame';
import { Performance } from './details/Performance';
import { ItemBuild } from './details/ItemBuild';
import { TimelineTab } from './details/TimelineTab';
import { Metrics } from './details/Metrics';
import { SlidingIndicator, useSlideDirection } from '../ui/Motion';
import { t } from '../../i18n';

const TABS = [
  { id: 'post', label: () => t('details.post') },
  { id: 'performance', label: () => t('details.performance') },
  { id: 'build', label: () => t('details.build') },
  { id: 'timeline', label: () => t('details.timeline') },
  { id: 'metrics', label: () => t('details.metrics') },
] as const;
type TabId = (typeof TABS)[number]['id'];

export function MatchDetails({ match, puuid, platform }: { match: MatchSummary; puuid: string; platform: string }) {
  const [tab, setTab] = useState<TabId>('post');
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const base = `md-${match.id}`;
  const dir = useSlideDirection(TABS.findIndex((x) => x.id === tab));

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
      <div role="tablist" aria-label={t('details.tabs')} className="relative flex gap-1 overflow-x-auto border-b border-line px-3">
        <SlidingIndicator />
        {TABS.map((item, i) => (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            id={`${base}-tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`${base}-panel`}
            tabIndex={tab === item.id ? 0 : -1}
            onClick={() => setTab(item.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={clsx(
              'relative whitespace-nowrap px-3 py-2.5 font-display text-base font-bold tracking-wide transition-colors',
              tab === item.id ? 'text-text' : 'text-muted hover:text-text',
            )}
          >
            {item.label()}
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
