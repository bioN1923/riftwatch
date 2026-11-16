import { useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { t } from '../../i18n';

/**
 * Copies the current page address (without any #hash); used on profiles and the draft helpers.
 * `labelled` keeps the text on phones too: on the draft helpers the button gets a row of its own anyway,
 * and a lone link icon there doesn't say what it does.
 */
export function CopyLink({ labelled = false }: { labelled?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href.split('#')[0]);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          /* clipboard blocked */
        }
      }}
      title={t('profile.copyLink')}
      className="inline-flex h-8 items-center gap-1.5 rounded border border-line-strong px-2.5 text-sm font-medium text-muted transition-colors hover:border-gold/60 hover:text-text sm:px-3"
    >
      {done ? <Check className="pop-in size-3.5 text-win" aria-hidden /> : <Link2 className="size-3.5" aria-hidden />}
      {/* Icon-only on phones (unless labelled), except for the short "Copied" confirmation. */}
      <span aria-live="polite" className={done || labelled ? undefined : 'sr-only sm:not-sr-only'}>
        {done ? t('profile.copied') : t('profile.copyLink')}
      </span>
    </button>
  );
}
