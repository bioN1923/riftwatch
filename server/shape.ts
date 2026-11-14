import type { LeagueEntry, LiveGame, MatchSummary, MatchTimeline, Participant, TeamSummary, TimelineEvent } from '../shared/types';
import { isArena } from '../shared/queues';

const POSITIONS = new Set(['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY']);

export function shapeLeague(raw: any[]): LeagueEntry[] {
  return raw.map((e) => ({
    queueType: e.queueType,
    tier: e.tier,
    rank: e.rank,
    leaguePoints: e.leaguePoints,
    wins: e.wins,
    losses: e.losses,
    hotStreak: !!e.hotStreak,
    veteran: !!e.veteran,
    freshBlood: !!e.freshBlood,
    miniSeries: e.miniSeries,
  }));
}

/** Convert a raw match-v5 payload into the compact MatchSummary the client renders. */
export function shapeMatch(raw: any): MatchSummary {
  const info = raw.info;
  const remake = info.participants.some((p: any) => p.gameEndedInEarlySurrender) || info.gameDuration < 240;

  const teamKills = new Map<number, number>();
  const teamGold = new Map<number, number>();
  for (const p of info.participants) {
    const key = p.playerSubteamId || p.teamId;
    teamKills.set(key, (teamKills.get(key) ?? 0) + p.kills);
    teamGold.set(p.teamId, (teamGold.get(p.teamId) ?? 0) + p.goldEarned);
  }

  const participants: Participant[] = info.participants.map((p: any) => {
    const tk = teamKills.get(p.playerSubteamId || p.teamId) || 0;
    const styles = p.perks?.styles ?? [];
    return {
      puuid: p.puuid,
      gameName: p.riotIdGameName ?? p.summonerName ?? '',
      tagLine: p.riotIdTagline ?? '',
      teamId: p.teamId,
      subteam: p.playerSubteamId || undefined,
      placement: p.placement || p.subteamPlacement || undefined,
      augments: ((a: number[]) => (a.length ? a : undefined))([p.playerAugment1, p.playerAugment2, p.playerAugment3, p.playerAugment4, p.playerAugment5, p.playerAugment6].filter((x: number) => x > 0)),
      win: !!p.win,
      championId: p.championId,
      champLevel: p.champLevel,
      position: POSITIONS.has(p.teamPosition) ? p.teamPosition : '',
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      cs: (p.totalMinionsKilled ?? 0) + (p.neutralMinionsKilled ?? 0),
      gold: p.goldEarned,
      damage: p.totalDamageDealtToChampions,
      damageTaken: p.totalDamageTaken,
      visionScore: p.visionScore ?? 0,
      wardsPlaced: p.wardsPlaced ?? 0,
      controlWards: p.visionWardsBoughtInGame ?? 0,
      items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6].map((x) => x ?? 0),
      spells: [p.summoner1Id, p.summoner2Id],
      keystone: styles[0]?.selections?.[0]?.perk ?? 0,
      primaryStyle: styles[0]?.style ?? 0,
      secondaryStyle: styles[1]?.style ?? 0,
      largestMultiKill: p.largestMultiKill ?? 0,
      killParticipation: tk ? (p.kills + p.assists) / tk : 0,
      score: 0,
      runes: {
        primary: (styles[0]?.selections ?? []).map((x: any) => x.perk),
        secondary: (styles[1]?.selections ?? []).map((x: any) => x.perk),
        shards: [p.perks?.statPerks?.offense, p.perks?.statPerks?.flex, p.perks?.statPerks?.defense].filter(Boolean),
      },
      extra: {
        soloKills: p.challenges?.soloKills ?? 0,
        turretPlates: p.challenges?.turretPlatesTaken ?? 0,
        csAt10: Math.round((p.challenges?.laneMinionsFirst10Minutes ?? 0) + (p.challenges?.jungleCsBefore10Minutes ?? 0)),
        firstBlood: !!(p.firstBloodKill || p.firstBloodAssist),
        damageMitigated: p.damageSelfMitigated ?? 0,
        healing: p.totalHealsOnTeammates ?? 0,
        shielding: p.totalDamageShieldedOnTeammates ?? 0,
        ccTime: p.timeCCingOthers ?? 0,
        objectiveDamage: p.damageDealtToObjectives ?? 0,
        turretDamage: p.damageDealtToBuildings ?? 0,
        skillshotsHit: p.challenges?.skillshotsHit ?? 0,
        skillshotsDodged: p.challenges?.skillshotsDodged ?? 0,
      },
    } satisfies Participant;
  });

  const teams: TeamSummary[] = (info.teams ?? []).map((t: any) => ({
    teamId: t.teamId,
    win: !!t.win,
    kills: t.objectives?.champion?.kills ?? 0,
    gold: teamGold.get(t.teamId) ?? 0,
    bans: (t.bans ?? []).map((b: any) => b.championId).filter((id: number) => id > 0),
    objectives: {
      baron: t.objectives?.baron?.kills ?? 0,
      dragon: t.objectives?.dragon?.kills ?? 0,
      tower: t.objectives?.tower?.kills ?? 0,
      herald: t.objectives?.riftHerald?.kills ?? 0,
      grubs: t.objectives?.horde?.kills ?? 0,
      inhibitor: t.objectives?.inhibitor?.kills ?? 0,
    },
  }));

  const summary: MatchSummary = {
    id: raw.metadata.matchId,
    queueId: info.queueId,
    gameMode: info.gameMode,
    startedAt: info.gameStartTimestamp ?? info.gameCreation,
    duration: info.gameDuration,
    version: info.gameVersion,
    remake,
    teams,
    participants,
  };
  scoreMatch(summary);
  return summary;
}

/**
 * A 0–10 performance score in the spirit of op.gg's OP Score. It blends KDA, kill
 * participation and each player's share of the lobby's best damage, gold, vision and CS.
 * The best player on the winning side gets MVP, the best on the losing side gets ACE.
 */
export function scoreMatch(m: MatchSummary) {
  const ps = m.participants;
  if (!ps.length) return;
  const minutes = Math.max(1, m.duration / 60);
  const max = (f: (p: Participant) => number) => Math.max(1, ...ps.map(f));
  const maxDmg = max((p) => p.damage);
  const maxGold = max((p) => p.gold);
  const maxVision = max((p) => p.visionScore);
  const maxCs = max((p) => p.cs);

  for (const p of ps) {
    const kda = Math.min(10, (p.kills + p.assists) / Math.max(1, p.deaths)) / 10;
    const raw =
      0.3 * kda +
      0.2 * Math.min(1, p.killParticipation) +
      0.22 * (p.damage / maxDmg) +
      0.1 * (p.gold / maxGold) +
      0.1 * (p.visionScore / maxVision) +
      0.08 * (p.cs / maxCs) +
      (p.win ? 0.05 : 0) -
      Math.min(0.1, p.deaths / minutes / 3);
    p.score = Math.round(Math.max(0, Math.min(1, raw / 0.85)) * 100) / 10;
  }

  if (m.remake || isArena(m.queueId)) return;
  const best = (win: boolean) => ps.filter((p) => p.win === win).sort((a, b) => b.score - a.score)[0];
  const mvp = best(true);
  const ace = best(false);
  if (mvp) mvp.badge = 'MVP';
  if (ace) ace.badge = 'ACE';
}

export function shapeLive(raw: any): LiveGame {
  return {
    inGame: true,
    gameId: raw.gameId,
    queueId: raw.gameQueueConfigId ?? 0,
    gameMode: raw.gameMode,
    startedAt: raw.gameStartTime || Date.now() - (raw.gameLength ?? 0) * 1000,
    participants: (raw.participants ?? []).map((p: any) => {
      const [gameName = '', tagLine = ''] = String(p.riotId ?? '').split('#');
      return {
        puuid: p.puuid ?? '',
        gameName,
        tagLine,
        teamId: p.teamId,
        championId: p.championId,
        spells: [p.spell1Id, p.spell2Id],
        keystone: p.perks?.perkIds?.[0] ?? 0,
        secondaryStyle: p.perks?.perkSubStyle ?? 0,
        profileIconId: p.profileIconId ?? 0,
      };
    }),
    bans: (raw.bannedChampions ?? [])
      .filter((b: any) => b.championId > 0)
      .map((b: any) => ({ teamId: b.teamId, championId: b.championId })),
  };
}

/** Reduce a match-v5 timeline to per-minute frames, key events, item purchases and skill order. */
export function shapeTimeline(raw: any, order: string[]): MatchTimeline {
  const info = raw.info;
  const idToPuuid = new Map<number, string>();
  if (Array.isArray(info.participants)) for (const p of info.participants) idToPuuid.set(p.participantId, p.puuid);
  else (raw.metadata?.participants ?? []).forEach((puuid: string, i: number) => idToPuuid.set(i + 1, puuid));
  const idx = (id: number) => (id > 0 ? order.indexOf(idToPuuid.get(id) ?? '') : -1);

  const n = order.length;
  const items: MatchTimeline['items'] = Array.from({ length: n }, () => []);
  const skills: MatchTimeline['skills'] = Array.from({ length: n }, () => []);
  const events: TimelineEvent[] = [];

  const frames = info.frames.map((f: any, minute: number) => {
    const out = { minute, gold: new Array(n).fill(0), cs: new Array(n).fill(0), xp: new Array(n).fill(0), level: new Array(n).fill(1), damage: new Array(n).fill(0) };
    for (const [id, pf] of Object.entries<any>(f.participantFrames ?? {})) {
      const i = idx(Number(id));
      if (i < 0) continue;
      out.gold[i] = pf.totalGold ?? 0;
      out.cs[i] = (pf.minionsKilled ?? 0) + (pf.jungleMinionsKilled ?? 0);
      out.xp[i] = pf.xp ?? 0;
      out.level[i] = pf.level ?? 1;
      out.damage[i] = pf.damageStats?.totalDamageDoneToChampions ?? 0;
    }
    for (const e of f.events ?? []) {
      const t = Math.round((e.timestamp ?? 0) / 1000);
      switch (e.type) {
        case 'CHAMPION_KILL':
          events.push({ type: 'kill', t, killer: idx(e.killerId), victim: idx(e.victimId), assists: (e.assistingParticipantIds ?? []).map(idx).filter((x: number) => x >= 0), x: e.position?.x ?? 0, y: e.position?.y ?? 0 });
          break;
        case 'ELITE_MONSTER_KILL':
          events.push({
            type: 'objective',
            t,
            teamId: e.killerTeamId,
            monster: e.monsterType,
            sub: e.monsterSubType,
            killer: idx(e.killerId),
            ...(e.position ? { x: e.position.x, y: e.position.y } : {}),
          });
          break;
        case 'BUILDING_KILL':
          // Riot reports the team that LOST the building; store the team that destroyed it.
          events.push({ type: 'building', t, teamId: e.teamId === 100 ? 200 : 100, building: e.buildingType === 'INHIBITOR_BUILDING' ? 'INHIBITOR' : 'TOWER', lane: e.laneType ?? '' });
          break;
        case 'ITEM_PURCHASED': {
          const i = idx(e.participantId);
          if (i >= 0) items[i].push({ t, itemId: e.itemId });
          break;
        }
        case 'ITEM_SOLD': {
          const i = idx(e.participantId);
          if (i >= 0) items[i].push({ t, itemId: e.itemId, sold: true });
          break;
        }
        case 'ITEM_UNDO': {
          const i = idx(e.participantId);
          if (i >= 0 && e.beforeId) {
            const list = items[i];
            for (let k = list.length - 1; k >= 0; k--) if (list[k].itemId === e.beforeId && !list[k].sold) { list.splice(k, 1); break; }
          }
          break;
        }
        case 'SKILL_LEVEL_UP': {
          const i = idx(e.participantId);
          if (i >= 0 && e.levelUpType === 'NORMAL') skills[i].push(e.skillSlot);
          break;
        }
      }
    }
    return out;
  });

  return { puuids: order, frames, events, items, skills };
}
