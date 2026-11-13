/**
 * Search-engine and link-preview text for each page, in every site language.
 * The client renders the real page; this is what crawlers and chat apps read from the HTML.
 * A language is chosen with ?lang=xx (the URLs listed in hreflang and the sitemap), then the
 * browser's Accept-Language, then English.
 */
export const SEO_LANGS = ['en', 'ro', 'de', 'fr', 'es', 'pl', 'pt'] as const;
export type SeoLang = (typeof SEO_LANGS)[number];
export const HTML_LANG: Record<SeoLang, string> = { en: 'en', ro: 'ro', de: 'de', fr: 'fr', es: 'es', pl: 'pl', pt: 'pt-BR' };
export const OG_LOCALE: Record<SeoLang, string> = { en: 'en_GB', ro: 'ro_RO', de: 'de_DE', fr: 'fr_FR', es: 'es_ES', pl: 'pl_PL', pt: 'pt_BR' };

interface Strings {
  siteTitle: string;
  siteDesc: string;
  tierTitle: string;
  tierDesc: string;
  ladderTitle: string;
  ladderDesc: string;
  msTitle: string;
  msDesc: string;
  cmpTitle: string;
  cmpDesc: string;
  champTitle: string; // {name}
  champDesc: string; // {name}
  champNotFound: string;
  vsNotFound: string;
  aramTitle: string; // {name}
  vsTitle: string; // {a} {b}
  vsDesc: string; // {a} {b}
  profileDesc: string; // {rank}
  profileDescUnranked: string;
}

const S: Record<SeoLang, Strings> = {
  en: {
    siteTitle: 'Riftwatch — League of Legends stats',
    siteDesc: 'Rank, match history, champion stats and live games for any League of Legends account.',
    tierTitle: 'Champion tier list · Riftwatch',
    tierDesc: 'The strongest League of Legends champions in every role this patch, from real ranked games.',
    ladderTitle: 'Ranked ladder · Riftwatch',
    ladderDesc: 'The top ranked League of Legends players in every region.',
    msTitle: 'Multi-search · Riftwatch',
    msDesc: 'Look up several players at once: rank, recent form and best champions for every Riot ID you paste.',
    cmpTitle: 'Compare players · Riftwatch',
    cmpDesc: 'Put two League of Legends players side by side: rank, recent form, per-game stats and champions.',
    champTitle: '{name} build, runes and counters · Riftwatch',
    champDesc: 'Win rate, best build, runes, skill order and matchups for {name}.',
    champNotFound: 'Champion not found · Riftwatch',
    vsNotFound: 'Matchup not found · Riftwatch',
    aramTitle: '{name} ARAM build and runes · Riftwatch',
    vsTitle: '{a} vs {b}: build, runes and win rate · Riftwatch',
    vsDesc: 'How to play {a} into {b}: who’s favoured, lane leads at 15 minutes, and the runes and items that win.',
    profileDesc: '{rank}. Match history, champion stats, rank history and live game.',
    profileDescUnranked: 'Match history, champion stats, rank history and live game.',
  },
  ro: {
    siteTitle: 'Riftwatch — statistici League of Legends',
    siteDesc: 'Rank, istoric de meciuri, statistici pe campioni și meciuri live pentru orice cont de League of Legends.',
    tierTitle: 'Tier list campioni · Riftwatch',
    tierDesc: 'Cei mai puternici campioni din League of Legends pe fiecare rol în acest patch, din meciuri ranked reale.',
    ladderTitle: 'Clasament ranked · Riftwatch',
    ladderDesc: 'Cei mai buni jucători ranked de League of Legends din fiecare regiune.',
    msTitle: 'Căutare multiplă · Riftwatch',
    msDesc: 'Caută mai mulți jucători deodată: rank, formă recentă și cei mai buni campioni pentru fiecare Riot ID lipit.',
    cmpTitle: 'Compară jucători · Riftwatch',
    cmpDesc: 'Pune doi jucători de League of Legends față în față: rank, formă recentă, statistici pe meci și campioni.',
    champTitle: '{name}: build, rune și counteri · Riftwatch',
    champDesc: 'Rată de victorie, cel mai bun build, rune, ordinea abilităților și matchup-uri pentru {name}.',
    champNotFound: 'Campion negăsit · Riftwatch',
    vsNotFound: 'Matchup negăsit · Riftwatch',
    aramTitle: '{name}: build și rune ARAM · Riftwatch',
    vsTitle: '{a} vs {b}: build, rune și rată de victorie · Riftwatch',
    vsDesc: 'Cum joci {a} contra {b}: cine e favorit, avantajul pe lane la minutul 15 și runele și itemele care câștigă.',
    profileDesc: '{rank}. Istoric de meciuri, statistici pe campioni, istoric de rank și meci live.',
    profileDescUnranked: 'Istoric de meciuri, statistici pe campioni, istoric de rank și meci live.',
  },
  de: {
    siteTitle: 'Riftwatch — League of Legends Statistiken',
    siteDesc: 'Rang, Spielverlauf, Champion-Statistiken und Live-Spiele für jeden League-of-Legends-Account.',
    tierTitle: 'Champion-Tierliste · Riftwatch',
    tierDesc: 'Die stärksten League-of-Legends-Champions jeder Rolle in diesem Patch, aus echten Ranglistenspielen.',
    ladderTitle: 'Ranglisten-Leiter · Riftwatch',
    ladderDesc: 'Die besten Ranglistenspieler in League of Legends in jeder Region.',
    msTitle: 'Multi-Suche · Riftwatch',
    msDesc: 'Mehrere Spieler auf einmal: Rang, aktuelle Form und beste Champions für jede eingefügte Riot-ID.',
    cmpTitle: 'Spieler vergleichen · Riftwatch',
    cmpDesc: 'Zwei League-of-Legends-Spieler im direkten Vergleich: Rang, aktuelle Form, Werte pro Spiel und Champions.',
    champTitle: '{name} Build, Runen und Konter · Riftwatch',
    champDesc: 'Siegrate, bester Build, Runen, Skill-Reihenfolge und Matchups für {name}.',
    champNotFound: 'Champion nicht gefunden · Riftwatch',
    vsNotFound: 'Matchup nicht gefunden · Riftwatch',
    aramTitle: '{name} ARAM-Build und Runen · Riftwatch',
    vsTitle: '{a} gegen {b}: Build, Runen und Siegrate · Riftwatch',
    vsDesc: 'So spielst du {a} gegen {b}: wer im Vorteil ist, Lane-Vorsprung nach 15 Minuten und die Runen und Items, die gewinnen.',
    profileDesc: '{rank}. Spielverlauf, Champion-Statistiken, Rangverlauf und Live-Spiel.',
    profileDescUnranked: 'Spielverlauf, Champion-Statistiken, Rangverlauf und Live-Spiel.',
  },
  fr: {
    siteTitle: 'Riftwatch — statistiques League of Legends',
    siteDesc: 'Rang, historique des parties, statistiques par champion et parties en direct pour n’importe quel compte League of Legends.',
    tierTitle: 'Tier list des champions · Riftwatch',
    tierDesc: 'Les champions League of Legends les plus forts à chaque rôle sur ce patch, d’après de vraies parties classées.',
    ladderTitle: 'Classement · Riftwatch',
    ladderDesc: 'Les meilleurs joueurs classés de League of Legends dans chaque région.',
    msTitle: 'Multi-recherche · Riftwatch',
    msDesc: 'Plusieurs joueurs à la fois : rang, forme récente et meilleurs champions pour chaque Riot ID collé.',
    cmpTitle: 'Comparer des joueurs · Riftwatch',
    cmpDesc: 'Deux joueurs de League of Legends côte à côte : rang, forme récente, statistiques par partie et champions.',
    champTitle: '{name} : build, runes et counters · Riftwatch',
    champDesc: 'Taux de victoire, meilleur build, runes, ordre des compétences et matchups pour {name}.',
    champNotFound: 'Champion introuvable · Riftwatch',
    vsNotFound: 'Matchup introuvable · Riftwatch',
    aramTitle: '{name} : build et runes ARAM · Riftwatch',
    vsTitle: '{a} contre {b} : build, runes et taux de victoire · Riftwatch',
    vsDesc: 'Comment jouer {a} contre {b} : qui est favori, l’avance en voie à 15 minutes et les runes et objets qui gagnent.',
    profileDesc: '{rank}. Historique des parties, statistiques par champion, historique du rang et partie en direct.',
    profileDescUnranked: 'Historique des parties, statistiques par champion, historique du rang et partie en direct.',
  },
  es: {
    siteTitle: 'Riftwatch — estadísticas de League of Legends',
    siteDesc: 'Rango, historial de partidas, estadísticas por campeón y partidas en directo de cualquier cuenta de League of Legends.',
    tierTitle: 'Tier list de campeones · Riftwatch',
    tierDesc: 'Los campeones más fuertes de League of Legends en cada rol este parche, a partir de partidas clasificatorias reales.',
    ladderTitle: 'Clasificación · Riftwatch',
    ladderDesc: 'Los mejores jugadores de clasificatoria de League of Legends en cada región.',
    msTitle: 'Multibúsqueda · Riftwatch',
    msDesc: 'Varios jugadores a la vez: rango, forma reciente y mejores campeones de cada Riot ID que pegues.',
    cmpTitle: 'Comparar jugadores · Riftwatch',
    cmpDesc: 'Dos jugadores de League of Legends cara a cara: rango, forma reciente, estadísticas por partida y campeones.',
    champTitle: '{name}: build, runas y counters · Riftwatch',
    champDesc: 'Tasa de victorias, mejor build, runas, orden de habilidades y enfrentamientos de {name}.',
    champNotFound: 'Campeón no encontrado · Riftwatch',
    vsNotFound: 'Enfrentamiento no encontrado · Riftwatch',
    aramTitle: '{name}: build y runas de ARAM · Riftwatch',
    vsTitle: '{a} contra {b}: build, runas y tasa de victorias · Riftwatch',
    vsDesc: 'Cómo jugar {a} contra {b}: quién es favorito, la ventaja en línea al minuto 15 y las runas y objetos que ganan.',
    profileDesc: '{rank}. Historial de partidas, estadísticas por campeón, historial de rango y partida en directo.',
    profileDescUnranked: 'Historial de partidas, estadísticas por campeón, historial de rango y partida en directo.',
  },
  pl: {
    siteTitle: 'Riftwatch — statystyki League of Legends',
    siteDesc: 'Ranga, historia meczów, statystyki bohaterów i gry na żywo dla każdego konta League of Legends.',
    tierTitle: 'Tier lista bohaterów · Riftwatch',
    tierDesc: 'Najsilniejsi bohaterowie League of Legends na każdej roli w tym patchu, na podstawie prawdziwych gier rankingowych.',
    ladderTitle: 'Ranking · Riftwatch',
    ladderDesc: 'Najlepsi gracze rankingowi League of Legends w każdym regionie.',
    msTitle: 'Multi-wyszukiwanie · Riftwatch',
    msDesc: 'Kilku graczy naraz: ranga, forma i najlepsi bohaterowie dla każdego wklejonego Riot ID.',
    cmpTitle: 'Porównaj graczy · Riftwatch',
    cmpDesc: 'Dwóch graczy League of Legends obok siebie: ranga, ostatnia forma, statystyki na mecz i bohaterowie.',
    champTitle: '{name}: build, runy i kontry · Riftwatch',
    champDesc: 'Współczynnik zwycięstw, najlepszy build, runy, kolejność umiejętności i matchupy dla {name}.',
    champNotFound: 'Nie znaleziono bohatera · Riftwatch',
    vsNotFound: 'Nie znaleziono matchupu · Riftwatch',
    aramTitle: '{name}: build i runy na ARAM · Riftwatch',
    vsTitle: '{a} vs {b}: build, runy i współczynnik zwycięstw · Riftwatch',
    vsDesc: 'Jak grać {a} przeciwko {b}: kto ma przewagę, prowadzenie na linii w 15. minucie oraz runy i przedmioty, które wygrywają.',
    profileDesc: '{rank}. Historia meczów, statystyki bohaterów, historia rangi i gra na żywo.',
    profileDescUnranked: 'Historia meczów, statystyki bohaterów, historia rangi i gra na żywo.',
  },
  pt: {
    siteTitle: 'Riftwatch — estatísticas de League of Legends',
    siteDesc: 'Elo, histórico de partidas, estatísticas por campeão e partidas ao vivo de qualquer conta de League of Legends.',
    tierTitle: 'Tier list de campeões · Riftwatch',
    tierDesc: 'Os campeões mais fortes de League of Legends em cada rota neste patch, a partir de partidas ranqueadas reais.',
    ladderTitle: 'Ranking · Riftwatch',
    ladderDesc: 'Os melhores jogadores ranqueados de League of Legends em cada região.',
    msTitle: 'Multibusca · Riftwatch',
    msDesc: 'Vários jogadores de uma vez: elo, fase recente e melhores campeões de cada Riot ID colado.',
    cmpTitle: 'Comparar jogadores · Riftwatch',
    cmpDesc: 'Dois jogadores de League of Legends lado a lado: elo, fase recente, estatísticas por partida e campeões.',
    champTitle: '{name}: build, runas e counters · Riftwatch',
    champDesc: 'Taxa de vitória, melhor build, runas, ordem de habilidades e confrontos de {name}.',
    champNotFound: 'Campeão não encontrado · Riftwatch',
    vsNotFound: 'Confronto não encontrado · Riftwatch',
    aramTitle: '{name}: build e runas de ARAM · Riftwatch',
    vsTitle: '{a} contra {b}: build, runas e taxa de vitória · Riftwatch',
    vsDesc: 'Como jogar de {a} contra {b}: quem é favorito, a vantagem na rota aos 15 minutos e as runas e itens que vencem.',
    profileDesc: '{rank}. Histórico de partidas, estatísticas por campeão, histórico de elo e partida ao vivo.',
    profileDescUnranked: 'Histórico de partidas, estatísticas por campeão, histórico de elo e partida ao vivo.',
  },
};

export function seoText(lang: SeoLang, key: keyof Strings, vars: Record<string, string> = {}) {
  return S[lang][key].replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

const isLang = (x: unknown): x is SeoLang => typeof x === 'string' && (SEO_LANGS as readonly string[]).includes(x);

/** ?lang=xx wins; otherwise the best match from Accept-Language; otherwise English. */
export function pickLang(queryLang: unknown, acceptLanguage: string | undefined): { lang: SeoLang; explicit: boolean } {
  if (isLang(queryLang)) return { lang: queryLang, explicit: true };
  for (const part of (acceptLanguage ?? '').split(',')) {
    const code = part.trim().split(';')[0].toLowerCase().split('-')[0];
    if (isLang(code)) return { lang: code, explicit: false };
  }
  return { lang: 'en', explicit: false };
}

/** <link rel="alternate" hreflang> for every language plus x-default, and a canonical URL. */
export function alternateLinks(origin: string, pathname: string, current: SeoLang | null, keep: URLSearchParams) {
  const url = (lang: SeoLang | null) => {
    const q = new URLSearchParams(keep);
    if (lang) q.set('lang', lang);
    const s = q.toString();
    return `${origin}${pathname}${s ? `?${s}` : ''}`;
  };
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return [
    `<link rel="canonical" href="${esc(url(current))}" />`,
    ...SEO_LANGS.map((l) => `<link rel="alternate" hreflang="${HTML_LANG[l]}" href="${esc(url(l))}" />`),
    `<link rel="alternate" hreflang="x-default" href="${esc(url(null))}" />`,
  ];
}

/** sitemap.xml with every language variant of each page linked together. */
export function sitemapXml(origin: string, paths: string[]) {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const withLang = (p: string, l: SeoLang) => `${origin}${p}${p.includes('?') ? '&' : '?'}lang=${l}`;
  const alts = (p: string) =>
    [...SEO_LANGS.map((l) => `<xhtml:link rel="alternate" hreflang="${HTML_LANG[l]}" href="${esc(withLang(p, l))}"/>`), `<xhtml:link rel="alternate" hreflang="x-default" href="${esc(origin + p)}"/>`].join('');
  const urls = paths.flatMap((p) => [`<url><loc>${esc(origin + p)}</loc>${alts(p)}</url>`, ...SEO_LANGS.map((l) => `<url><loc>${esc(withLang(p, l))}</loc>${alts(p)}</url>`)]);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
}
