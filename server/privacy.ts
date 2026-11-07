import fs from 'node:fs';
import path from 'node:path';
import { randomInt } from 'node:crypto';

/**
 * Players who asked for their profile to be hidden, and pending ownership checks.
 *
 * There are no accounts on the site, so a player proves they own a Riot account the way other
 * stats sites do before Riot Sign-On: we name one of the free starter icons, they equip it in
 * the League client, and we read their profile icon back from Riot (summoner-v4). If it matches
 * within 15 minutes, the request is carried out.
 */
export type PrivacyAction = 'hide' | 'show';
interface Challenge {
  puuid: string;
  platform: string;
  gameName: string;
  tagLine: string;
  iconId: number;
  action: PrivacyAction;
  expires: number;
}

export const CHALLENGE_MS = 15 * 60_000;
/** The free starter icons every account owns (ids 0–28). */
const STARTER_ICONS = Array.from({ length: 29 }, (_, i) => i);

export class PrivacyStore {
  private hidden = new Set<string>();
  private challenges = new Map<string, Challenge>(); // by puuid

  constructor(private file: string | null) {
    if (file) {
      try {
        this.hidden = new Set(JSON.parse(fs.readFileSync(file, 'utf8')));
      } catch {
        /* first run */
      }
    }
  }

  isHidden(puuid: string | undefined | null) {
    return !!puuid && this.hidden.has(puuid);
  }

  get count() {
    return this.hidden.size;
  }

  /** Start a check: pick a starter icon the player isn't using now. */
  challenge(account: { puuid: string; gameName: string; tagLine: string }, platform: string, currentIcon: number, action: PrivacyAction): Challenge {
    const { puuid, gameName, tagLine } = account;
    const choices = STARTER_ICONS.filter((i) => i !== currentIcon);
    const c: Challenge = { puuid, platform, gameName, tagLine, iconId: choices[randomInt(choices.length)], action, expires: Date.now() + CHALLENGE_MS };
    this.challenges.set(puuid, c);
    for (const [k, v] of this.challenges) if (v.expires < Date.now()) this.challenges.delete(k);
    return c;
  }

  pending(puuid: string) {
    const c = this.challenges.get(puuid);
    return c && c.expires > Date.now() ? c : undefined;
  }

  /** Finish a check with the icon Riot reports now. Returns the action carried out, if any. */
  verify(puuid: string, iconNow: number): Challenge | null {
    const c = this.pending(puuid);
    if (!c || c.iconId !== iconNow) return null;
    this.challenges.delete(puuid);
    if (c.action === 'hide') this.hidden.add(puuid);
    else this.hidden.delete(puuid);
    this.save();
    return c;
  }

  private save() {
    if (!this.file) return;
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      fs.writeFileSync(this.file, JSON.stringify([...this.hidden]));
    } catch (e) {
      console.warn('Could not save privacy settings:', (e as Error).message);
    }
  }
}
