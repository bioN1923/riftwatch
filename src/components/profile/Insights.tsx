import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { Plus, Target, X } from "lucide-react";
import type { LpPoint, MatchSummary, Participant } from "../../../shared/types";
import { ladderValue } from "../../lib/ladder";
import { api } from "../../lib/api";
import { assets, champSlug, useStaticData } from "../../lib/ddragon";
import { champClass, decimal, pct } from "../../lib/format";
import { tryNext } from "../../lib/tryNext";
import { me } from "../../lib/stats";
import { GameImg } from "../ui/GameImg";
import { PatchDelta } from "../ui/PatchDelta";
import { RoleIcon, ROLE_LABEL } from "../ui/RoleIcon";
import { TierBadge } from "../champions/common";
import { t } from "../../i18n";

/** Summoner's Rift games (normal, ranked, quickplay): the ones where lane stats mean something. */
const SR_QUEUES = new Set([400, 420, 430, 440, 480, 490]);

/* ------------------------------------------------------------ patch watch */

/**
 * The player's most played champions, each in their usual role, with this patch's win rate
 * from the site's aggregate stats and the change since last patch. Answers "did my champions
 * just get better or worse?" without opening five champion pages.
 */
export function PatchWatch({
  matches,
  puuid,
}: {
  matches?: MatchSummary[];
  puuid: string;
}) {
  const { data: sd } = useStaticData();
  const a = assets(sd);
  const tier = useQuery({
    queryKey: ["tierlist", "ranked", undefined],
    queryFn: ({ signal }) => api.tierList("ranked", undefined, signal),
    staleTime: 5 * 60_000,
  });

  const picks = useMemo(() => {
    const byChamp = new Map<
      number,
      { games: number; roles: Record<string, number> }
    >();
    for (const m of matches ?? []) {
      if (m.remake || !SR_QUEUES.has(m.queueId)) continue;
      const p = me(m, puuid);
      if (!p?.position) continue;
      const c = byChamp.get(p.championId) ?? { games: 0, roles: {} };
      c.games++;
      c.roles[p.position] = (c.roles[p.position] ?? 0) + 1;
      byChamp.set(p.championId, c);
    }
    return [...byChamp.entries()]
      .map(([championId, c]) => ({
        championId,
        games: c.games,
        role: Object.entries(c.roles).sort((x, y) => y[1] - x[1])[0][0],
      }))
      .sort((x, y) => y.games - x.games)
      .slice(0, 5);
  }, [matches, puuid]);

  const rows = tier.data
    ? picks
        .map((p) => ({
          ...p,
          row: tier.data!.rows.find(
            (r) => r.championId === p.championId && r.role === p.role,
          ),
        }))
        .filter((p) => p.row)
    : [];
  if (!tier.data?.patch || rows.length === 0) return null;

  return (
    <section className="panel p-4" aria-labelledby="pw-h">
      <h2 id="pw-h" className="panel-title">
        {t("pw.title", { patch: tier.data.patch })}
      </h2>
      <p className="mt-0.5 text-xs text-muted">{t("pw.sub")}</p>
      <ul className="mt-3 space-y-1">
        {rows.map(({ championId, role, row }) => {
          const c = a.champion(championId);
          const slug = sd?.champions.get(championId)?.id;
          return (
            <li key={championId}>
              <Link
                to={slug ? `/champions/${champSlug(slug)}?role=${role}` : "#"}
                className="grid grid-cols-[28px_minmax(0,1fr)_auto_auto] items-center gap-2.5 rounded px-1 py-1 transition-colors hover:bg-raised"
              >
                <GameImg src={c.url} alt="" size={28} rounded="sm" />
                <span className="flex min-w-0 items-center gap-1.5 truncate text-sm">
                  {c.name}
                  <span
                    title={ROLE_LABEL[role]}
                    className="shrink-0 text-faint"
                  >
                    <RoleIcon role={role} size={12} />
                  </span>
                </span>
                <TierBadge tier={row!.tier} />
                <span className="flex w-12 flex-col items-end leading-tight">
                  <span className="num text-sm font-semibold">
                    {pct(row!.winRate, 1)}
                  </span>
                  <PatchDelta now={row!.winRate} before={row!.prevWinRate} />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* --------------------------------------------------------------- try next */

/** Champions the player hasn't been playing that fit their main role and style, strong this patch. */
export function TryNext({ matches, puuid }: { matches?: MatchSummary[]; puuid: string }) {
  const { data: sd } = useStaticData();
  const a = assets(sd);
  const tier = useQuery({
    queryKey: ["tierlist", "ranked", undefined],
    queryFn: ({ signal }) => api.tierList("ranked", undefined, signal),
    staleTime: 5 * 60_000,
  });
  const played = useMemo(() => {
    const byChamp = new Map<number, { games: number; roles: Record<string, number> }>();
    for (const m of matches ?? []) {
      if (m.remake || !SR_QUEUES.has(m.queueId)) continue;
      const p = me(m, puuid);
      if (!p?.position) continue;
      const c = byChamp.get(p.championId) ?? { games: 0, roles: {} };
      c.games++;
      c.roles[p.position] = (c.roles[p.position] ?? 0) + 1;
      byChamp.set(p.championId, c);
    }
    return [...byChamp.entries()]
      .map(([championId, c]) => ({ championId, games: c.games, role: Object.entries(c.roles).sort((x, y) => y[1] - x[1])[0][0] }))
      .sort((x, y) => y.games - x.games);
  }, [matches, puuid]);
  const picks = tier.data && sd ? tryNext(played, tier.data.rows, (id) => sd.champions.get(id)?.tags ?? []) : [];
  if (!tier.data?.patch || picks.length === 0) return null;
  const role = played[0].role;
  return (
    <section className="panel p-4" aria-labelledby="tn-h">
      <h2 id="tn-h" className="panel-title">
        {t("tn.title")}
      </h2>
      <p className="mt-0.5 text-xs text-muted">{t("tn.sub", { role: ROLE_LABEL[role], patch: tier.data.patch })}</p>
      <ul className="mt-3 space-y-1">
        {picks.map(({ championId, row, like, tag }) => {
          const c = a.champion(championId);
          const slug = sd?.champions.get(championId)?.id;
          return (
            <li key={championId}>
              <Link
                to={slug ? `/champions/${champSlug(slug)}?role=${role}` : "#"}
                className="grid grid-cols-[28px_minmax(0,1fr)_auto_auto] items-center gap-2.5 rounded px-1 py-1 transition-colors hover:bg-raised"
              >
                <GameImg src={c.url} alt="" size={28} rounded="sm" />
                <span className="min-w-0">
                  <span className="block truncate text-sm">{c.name}</span>
                  <span className="block truncate text-[11px] text-muted">
                    {t("tn.like", { name: a.champion(like).name, cls: champClass(tag) })}
                  </span>
                </span>
                <TierBadge tier={row.tier} />
                <span className="num w-12 text-right text-sm font-semibold">{pct(row.winRate, 1)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ goals */

type MetricId = "cs" | "deaths" | "vision" | "kp" | "dmg" | "wards";
interface Metric {
  id: MetricId;
  label: () => string;
  /** A value per game, or null when it doesn't apply to that game. */
  value: (m: MatchSummary, p: Participant) => number;
  fmt: (v: number) => string;
  atMost?: boolean; // lower is better: the goal is "at most"
  start: number;
  step: number;
}

const METRICS: Metric[] = [
  {
    id: "cs",
    label: () => t("goal.cs"),
    value: (m, p) => p.cs / (m.duration / 60),
    fmt: (v) => decimal(v, 1),
    start: 7,
    step: 0.5,
  },
  {
    id: "deaths",
    label: () => t("goal.deaths"),
    value: (_m, p) => p.deaths,
    fmt: (v) => String(Math.round(v)),
    atMost: true,
    start: 5,
    step: 1,
  },
  {
    id: "vision",
    label: () => t("goal.vision"),
    value: (m, p) => p.visionScore / (m.duration / 60),
    fmt: (v) => decimal(v, 1),
    start: 1,
    step: 0.1,
  },
  {
    id: "kp",
    label: () => t("goal.kp"),
    value: (_m, p) => p.killParticipation,
    fmt: (v) => pct(v, 0),
    start: 0.5,
    step: 0.05,
  },
  {
    id: "dmg",
    label: () => t("goal.dmg"),
    value: (m, p) => p.damage / (m.duration / 60),
    fmt: (v) => String(Math.round(v)),
    start: 600,
    step: 50,
  },
  {
    id: "wards",
    label: () => t("goal.wards"),
    value: (_m, p) => p.controlWards,
    fmt: (v) => String(Math.round(v)),
    start: 2,
    step: 1,
  },
];
const metric = (id: MetricId) => METRICS.find((x) => x.id === id)!;

interface Goal {
  metric: MetricId;
  target: number;
}

/** Goals are personal and saved only in this browser, one list per player. */
function useGoals(puuid: string) {
  const key = `rw:goals:${puuid}`;
  const read = (): Goal[] => {
    try {
      const v = JSON.parse(localStorage.getItem(key) ?? "[]");
      return Array.isArray(v)
        ? v.filter(
            (g) =>
              METRICS.some((m) => m.id === g?.metric) &&
              Number.isFinite(g?.target),
          )
        : [];
    } catch {
      return [];
    }
  };
  const [goals, setGoals] = useState<Goal[]>(read);
  const save = (next: Goal[]) => {
    setGoals(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* storage blocked: goals last for this visit */
    }
  };
  return [goals, save] as const;
}

export function Goals({
  matches,
  puuid,
}: {
  matches?: MatchSummary[];
  puuid: string;
}) {
  const [goals, setGoals] = useGoals(puuid);
  const [adding, setAdding] = useState(false);
  // Oldest first, so the dots read left to right like a timeline.
  const games = useMemo(
    () =>
      (matches ?? [])
        .filter((m) => !m.remake && SR_QUEUES.has(m.queueId))
        .slice(0, 20)
        .reverse()
        .flatMap((m) => {
          const p = me(m, puuid);
          return p ? [{ m, p }] : [];
        }),
    [matches, puuid],
  );
  const unused = METRICS.filter((m) => !goals.some((g) => g.metric === m.id));

  return (
    <section className="panel p-4" aria-labelledby="goals-h">
      <h2 id="goals-h" className="panel-title flex items-center gap-1.5">
        <Target className="size-4 text-gold" aria-hidden /> {t("goal.title")}
      </h2>
      {goals.length === 0 && !adding && (
        <p className="mt-1 text-xs text-muted">{t("goal.empty")}</p>
      )}

      <ul className="mt-3 space-y-3.5">
        {goals.map((g, i) => {
          const def = metric(g.metric);
          const vals = games.map(({ m, p }) => def.value(m, p));
          const hit = vals.map((v) =>
            def.atMost ? v <= g.target : v >= g.target,
          );
          const met = hit.filter(Boolean).length;
          let streak = 0;
          for (let j = hit.length - 1; j >= 0 && hit[j]; j--) streak++;
          const avg = vals.length
            ? vals.reduce((s, v) => s + v, 0) / vals.length
            : 0;
          return (
            <li key={g.metric}>
              <div className="flex items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate font-medium">
                  {def.label()}
                </span>
                <span className="text-xs text-muted">
                  {def.atMost ? "≤" : "≥"}
                </span>
                <input
                  type="number"
                  aria-label={t("goal.targetFor", { metric: def.label() })}
                  value={g.target}
                  step={def.step}
                  min={0}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (Number.isFinite(v))
                      setGoals(
                        goals.map((x, j) =>
                          j === i ? { ...x, target: v } : x,
                        ),
                      );
                  }}
                  className="num h-7 w-16 rounded border border-line bg-sunken px-1.5 text-right text-sm outline-none focus:border-gold"
                />
                <button
                  onClick={() => setGoals(goals.filter((_, j) => j !== i))}
                  aria-label={t("goal.remove", { metric: def.label() })}
                  className="grid size-6 place-items-center rounded text-faint hover:bg-raised hover:text-text"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </div>
              {games.length ? (
                <>
                  <ol
                    className="mt-1.5 flex gap-[3px]"
                    aria-label={t("goal.dotsAria", {
                      met,
                      count: games.length,
                    })}
                  >
                    {hit.map((h, j) => (
                      <li
                        key={j}
                        title={`${def.fmt(vals[j])}`}
                        className={clsx(
                          "h-2.5 flex-1 rounded-[2px]",
                          h ? "bg-win" : "bg-loss/60",
                        )}
                      />
                    ))}
                  </ol>
                  <p className="mt-1 text-xs text-muted">
                    {t("goal.summary", {
                      met,
                      count: games.length,
                      avg: def.fmt(avg),
                    })}
                    {streak >= 2 && (
                      <span className="ml-1 font-medium text-win">
                        {t("goal.streak", { count: streak })}
                      </span>
                    )}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-xs text-faint">{t("goal.noGames")}</p>
              )}
            </li>
          );
        })}
      </ul>

      {goals.length < 3 &&
        (adding ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {unused.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setGoals([...goals, { metric: m.id, target: m.start }]);
                  setAdding(false);
                }}
                className="rounded-full border border-line px-2.5 py-1 text-xs text-muted transition-colors hover:border-gold/60 hover:text-text"
              >
                {m.label()}
              </button>
            ))}
            <button
              onClick={() => setAdding(false)}
              className="px-1.5 text-xs text-faint hover:text-text"
            >
              {t("pv.cancel")}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-gold hover:underline"
          >
            <Plus className="size-3.5" aria-hidden /> {t("goal.add")}
          </button>
        ))}
      <p className="mt-3 text-[11px] text-faint">{t("goal.local")}</p>
    </section>
  );
}

/* ------------------------------------------------------------- benchmarks */

/**
 * The player's per-game numbers in a role next to the average of the high-elo games Riftwatch
 * collects (Challenger and Grandmaster), so "is 6.8 CS a minute good?" has an answer.
 */
export function Benchmarks({
  matches,
  puuid,
}: {
  matches: MatchSummary[];
  puuid: string;
}) {
  const byRole = useMemo(() => {
    const out = new Map<
      string,
      {
        g: number;
        k: number;
        d: number;
        a: number;
        cs: number;
        dmg: number;
        gold: number;
        min: number;
      }
    >();
    for (const m of matches) {
      if (m.remake || !SR_QUEUES.has(m.queueId)) continue;
      const p = me(m, puuid);
      if (!p?.position) continue;
      const r = out.get(p.position) ?? {
        g: 0,
        k: 0,
        d: 0,
        a: 0,
        cs: 0,
        dmg: 0,
        gold: 0,
        min: 0,
      };
      r.g++;
      r.k += p.kills;
      r.d += p.deaths;
      r.a += p.assists;
      r.cs += p.cs;
      r.dmg += p.damage;
      r.gold += p.gold;
      r.min += m.duration / 60;
      out.set(p.position, r);
    }
    return out;
  }, [matches, puuid]);
  const roles = [...byRole.entries()]
    .filter(([, r]) => r.g >= 3)
    .sort((x, y) => y[1].g - x[1].g);
  const [picked, setPicked] = useState<string | null>(null);
  const role = picked && byRole.has(picked) ? picked : roles[0]?.[0];
  const bench = useQuery({
    queryKey: ["benchmarks", role],
    enabled: !!role,
    queryFn: ({ signal }) => api.benchmarks(role!, undefined, signal),
    staleTime: 10 * 60_000,
  });
  if (!roles.length || !role) return null;
  const mine = byRole.get(role)!;
  const avg = bench.data?.avg;

  const rows: {
    label: string;
    me: number;
    them: number;
    fmt: (v: number) => string;
    lower?: boolean;
  }[] = avg
    ? [
        {
          label: t("bench.cs"),
          me: mine.cs / mine.min,
          them: avg.csPerMin,
          fmt: (v) => decimal(v, 1),
        },
        {
          label: t("bench.gold"),
          me: mine.gold / mine.min,
          them: avg.goldPerMin,
          fmt: (v) => String(Math.round(v)),
        },
        {
          label: t("bench.dmg"),
          me: mine.dmg / mine.min,
          them: avg.damagePerMin,
          fmt: (v) => String(Math.round(v)),
        },
        {
          label: t("bench.kills"),
          me: mine.k / mine.g,
          them: avg.kills,
          fmt: (v) => decimal(v, 1),
        },
        {
          label: t("bench.deaths"),
          me: mine.d / mine.g,
          them: avg.deaths,
          fmt: (v) => decimal(v, 1),
          lower: true,
        },
        {
          label: t("bench.assists"),
          me: mine.a / mine.g,
          them: avg.assists,
          fmt: (v) => decimal(v, 1),
        },
      ]
    : [];

  return (
    <section className="panel p-4" aria-labelledby="bench-h">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="bench-h" className="panel-title">
            {t("bench.title")}
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            {t("bench.sub", {
              games: mine.g,
              role: ROLE_LABEL[role],
              patch: bench.data?.patch ?? "",
            })}
          </p>
        </div>
        {roles.length > 1 && (
          <div
            role="tablist"
            aria-label={t("bench.role")}
            className="flex gap-1"
          >
            {roles.map(([r]) => (
              <button
                key={r}
                role="tab"
                aria-selected={r === role}
                title={ROLE_LABEL[r]}
                onClick={() => setPicked(r)}
                className={clsx(
                  "grid size-8 place-items-center rounded border transition-colors",
                  r === role
                    ? "border-gold text-text"
                    : "border-line text-muted hover:text-text",
                )}
              >
                <RoleIcon role={r} size={15} />
                <span className="sr-only">{ROLE_LABEL[r]}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {!avg ? (
        <p className="mt-3 text-sm text-faint">
          {bench.isPending ? t("common.loading") : t("bench.noData")}
        </p>
      ) : (
        <table className="mt-3 w-full text-sm">
          <caption className="sr-only">{t("bench.title")}</caption>
          <thead>
            <tr className="text-left text-xs text-muted">
              <th scope="col" className="pb-1.5 font-normal">
                <span className="sr-only">{t("pc.stat")}</span>
              </th>
              <th scope="col" className="pb-1.5 text-right font-normal">
                {t("bench.you")}
              </th>
              <th scope="col" className="pb-1.5 text-right font-normal">
                {t("bench.them")}
              </th>
              <th scope="col" className="w-[38%] pb-1.5 pl-4 font-normal">
                <span className="sr-only">{t("bench.diff")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const diff = r.them ? (r.me - r.them) / r.them : 0;
              const good = r.lower ? diff <= 0 : diff >= 0;
              const width = Math.min(50, Math.abs(diff) * 100);
              return (
                <tr key={r.label} className="border-t border-line">
                  <th
                    scope="row"
                    className="py-1.5 text-left font-normal text-muted"
                  >
                    {r.label}
                  </th>
                  <td className="num py-1.5 text-right font-semibold">
                    {r.fmt(r.me)}
                  </td>
                  <td className="num py-1.5 text-right text-muted">
                    {r.fmt(r.them)}
                  </td>
                  <td className="py-1.5 pl-4">
                    <span className="flex items-center gap-2">
                      <span
                        className="relative h-1.5 flex-1 rounded-full bg-sunken"
                        aria-hidden
                      >
                        <span className="absolute inset-y-0 left-1/2 w-px bg-line-strong" />
                        <span
                          className={clsx(
                            "absolute inset-y-0 rounded-full",
                            good ? "bg-win" : "bg-loss",
                          )}
                          style={
                            diff >= 0
                              ? { left: "50%", width: `${width}%` }
                              : { right: "50%", width: `${width}%` }
                          }
                        />
                      </span>
                      <span
                        className={clsx(
                          "num w-11 text-right text-xs font-medium",
                          good ? "text-win" : "text-loss",
                        )}
                      >
                        {diff >= 0 ? "+" : "−"}
                        {pct(Math.abs(diff), 0)}
                      </span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <p className="mt-3 text-[11px] text-faint">
        {t("bench.note", { count: bench.data?.games ?? 0 })}
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ today */

/**
 * Today's session at a glance: games, wins and losses, LP change (when rank history covers
 * today) and the best game. Shown only on days the player has played.
 */
export function Today({
  matches,
  puuid,
  lp,
}: {
  matches?: MatchSummary[];
  puuid: string;
  lp?: LpPoint[];
}) {
  const { data: sd } = useStaticData();
  const a = assets(sd);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const today = (matches ?? []).filter(
    (m) => !m.remake && m.startedAt >= start.getTime(),
  );
  const mine = today.flatMap((m) => {
    const p = me(m, puuid);
    return p ? [{ m, p }] : [];
  });
  if (!mine.length) return null;
  const wins = mine.filter((x) => x.p.win).length;
  const solo = (lp ?? []).filter((x) => x.queue === "RANKED_SOLO_5x5");
  const before =
    [...solo].reverse().find((x) => x.t < start.getTime()) ??
    solo.find((x) => x.t >= start.getTime());
  const now = solo.at(-1);
  const lpDelta =
    before && now && now.t >= start.getTime() && now !== before
      ? ladderValue(now) - ladderValue(before)
      : null;
  const best = [...mine].sort((x, y) => y.p.score - x.p.score)[0];
  const c = a.champion(best.p.championId);
  return (
    <section className="panel p-4" aria-labelledby="today-h">
      <h2 id="today-h" className="panel-title">
        {t("today.title")}
      </h2>
      <dl className="mt-2 grid grid-cols-3 gap-2 text-center">
        <div>
          <dt className="text-[11px] text-muted">{t("today.games")}</dt>
          <dd className="display-num text-2xl font-bold">{mine.length}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-muted">{t("today.record")}</dt>
          <dd className="display-num text-2xl font-bold">
            <span className="text-win">{wins}</span>
            <span className="text-faint">–</span>
            <span className="text-loss">{mine.length - wins}</span>
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-muted">{t("today.lp")}</dt>
          <dd
            className={clsx(
              "display-num text-2xl font-bold",
              lpDelta == null
                ? "text-faint"
                : lpDelta >= 0
                  ? "text-win"
                  : "text-loss",
            )}
          >
            {lpDelta == null
              ? "–"
              : `${lpDelta >= 0 ? "+" : "−"}${Math.abs(lpDelta)}`}
          </dd>
        </div>
      </dl>
      {mine.length >= 2 && (
        <p className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-sm">
          <GameImg src={c.url} alt="" size={24} rounded="sm" />
          <span className="min-w-0 truncate">
            {t.rich("today.best", {
              champion: <b>{c.name}</b>,
              kda: (
                <span className="num">{`${best.p.kills}/${best.p.deaths}/${best.p.assists}`}</span>
              ),
            })}
          </span>
        </p>
      )}
    </section>
  );
}
