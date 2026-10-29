/**
 * Places a fishing section on the map from its name and boundary description using
 * OpenStreetMap layers: picks the right river (by name, near the club or gauge), resolves the
 * "od X do Y" ends to points on it and cuts the stretch between them.
 */
import { closestOnLine, distKm, lineLengthKm, midpointAlong, simplify, type LonLat } from './geo';
import type { OsmPoint, OsmPond, OsmRiver, OsmWater } from './osm-extract';
import { abbreviatedKey, classifyBound, norm, phraseVariants, splitBounds, toponymCandidates, waterName } from './toponyms';

export type Quality = 'segment' | 'partial' | 'water' | 'manual' | 'gauge' | 'place' | 'none';

export type Placement = {
  quality: Quality;
  geometry:
    | { type: 'LineString'; coordinates: LonLat[] }
    | { type: 'Polygon'; coordinates: LonLat[][] }
    | { type: 'Point'; coordinates: LonLat }
    | null;
  /** [lon, lat] label/forecast point. */
  center: LonLat | null;
  lengthKm: number | null;
  /** OSM river or lake name actually matched (used for ARSO station matching). */
  matchedWater: string | null;
  notes: string[];
};

export type OsmLayers = {
  rivers: OsmRiver[];
  waters: OsmWater[];
  places: OsmPoint[];
  structures: OsmPoint[];
  /** All still waters, named or not (may be empty for OSM builds made before it existed). */
  ponds?: OsmPond[];
};

type Cluster = { name: string; parts: OsmRiver[]; vertices: LonLat[] };

const key = (p: LonLat) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`;

export class Geocoder {
  private riversByName = new Map<string, OsmRiver[]>();
  private placesByName = new Map<string, OsmPoint[]>();
  private clusterCache = new Map<string, Cluster[]>();

  constructor(private osm: OsmLayers) {
    for (const r of osm.rivers) {
      for (const n of riverNameKeys(r.name)) push(this.riversByName, n, r);
    }
    for (const p of osm.places) {
      if (p.at[1] < 45.2 || p.at[1] > 47.1 || p.at[0] < 13.1 || p.at[0] > 16.9) continue;
      for (const k of riverNameKeys(p.name)) push(this.placesByName, k, p);
      const abbr = abbreviatedKey(p.name);
      if (abbr !== norm(p.name)) push(this.placesByName, abbr, p);
    }
    // Named dams, weirs, bridges and lakes are also valid boundary landmarks.
    for (const s of osm.structures) if (s.name) push(this.placesByName, norm(s.name), { ...s, kind: 'locality' });
    for (const w of osm.waters) if (!isGenericWaterName(w.name)) push(this.placesByName, norm(w.name), { id: w.id, name: w.name, kind: 'locality', at: w.centroid });
  }

  /**
   * Town of a club. The URL slug is the most specific clue ("rd-ilirska-bistrica" for
   * "Ribiška družina Bistrica"); then the name, its last word(s) ("Bistrica Domžale" → Domžale).
   */
  clubSeat(clubName: string, clubSlug = ''): LonLat | null {
    if (/zavod|zveza/i.test(clubName)) return null;
    const fromSlug = clubSlug.replace(/^rd-/, '').replace(/-/g, ' ');
    const rest = clubName.replace(/^(ribiška družina|ribiško društvo|rd)\s+/i, '').trim();
    const words = rest.split(/\s+/);
    const slugWords = fromSlug.split(' ');
    const tries = [fromSlug, rest, slugWords.slice(-1).join(' '), words.slice(-1).join(' '), words.slice(-2).join(' '), words[0]];
    for (const t of tries) {
      if (!t) continue;
      const hits = (this.placesByName.get(norm(t)) ?? []).sort((a, b) => placeRank(a.kind) - placeRank(b.kind));
      if (hits.length) return hits[0].at;
    }
    return null;
  }

  /** True when OSM has a river or stream by this name ("Bečovnica 2" → Bečovnica). */
  knowsRiver(name: string): boolean {
    const n = waterName(name);
    return n.length > 2 && this.clusters(n).length > 0;
  }

  /** River names in OSM whose words share a stem with `name` ("Kanomljica" ~ "Kanomlja"). */
  fuzzyRiverNames(name: string, near: LonLat | null, maxKm = 25): string[] {
    const stems = norm(name)
      .split(' ')
      .filter((w) => w.length >= 5)
      .map((w) => w.slice(0, Math.max(5, w.length - 3)));
    if (!stems.length) return [];
    const found = new Map<string, number>();
    for (const r of this.osm.rivers) {
      const words = norm(r.name).split(' ');
      if (!stems.every((st) => words.some((w) => w.startsWith(st)))) continue;
      const d = near ? Math.min(distKm(near, r.line[0]), distKm(near, r.line[r.line.length - 1]), distKm(near, r.line[Math.floor(r.line.length / 2)])) : 0;
      if (d <= maxKm) found.set(r.name, Math.min(found.get(r.name) ?? Infinity, d));
    }
    return [...found].sort((a, b) => a[1] - b[1]).map(([n]) => n);
  }

  private clusters(name: string): Cluster[] {
    const variants = [...new Set(phraseVariants(name).map(norm))];
    const cacheKey = variants.join('|');
    const cached = this.clusterCache.get(cacheKey);
    if (cached) return cached;
    const parts = [...new Set(variants.flatMap((v) => this.riversByName.get(v) ?? []))];
    // Union parts that share an endpoint (OSM ways of one river are chained end to end).
    const parent = parts.map((_, i) => i);
    const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    const ends = new Map<string, number>();
    parts.forEach((p, i) => {
      for (const v of [p.line[0], p.line[p.line.length - 1]]) {
        const k = key(v);
        if (ends.has(k)) parent[find(i)] = find(ends.get(k)!);
        else ends.set(k, i);
      }
    });
    // Also join parts whose ends are within 60 m (simplification can nudge shared nodes).
    for (let i = 0; i < parts.length; i++) {
      for (let j = i + 1; j < parts.length; j++) {
        if (find(i) === find(j)) continue;
        const a = parts[i].line;
        const b = parts[j].line;
        const pairs: [LonLat, LonLat][] = [
          [a[0], b[0]],
          [a[0], b[b.length - 1]],
          [a[a.length - 1], b[0]],
          [a[a.length - 1], b[b.length - 1]],
        ];
        if (pairs.some(([x, y]) => distKm(x, y) < 1.5)) parent[find(i)] = find(j);
      }
    }
    const groups = new Map<number, OsmRiver[]>();
    parts.forEach((p, i) => push(groups, find(i), p));
    const result = [...groups.values()].map((ps) => ({ name: ps[0].name, parts: ps, vertices: ps.flatMap((p) => p.line) }));
    this.clusterCache.set(cacheKey, result);
    return result;
  }

  private distToCluster(p: LonLat, c: Cluster): { km: number; point: LonLat } {
    let best = { km: Infinity, point: p };
    for (const part of c.parts) {
      const r = closestOnLine(p, part.line);
      if (r.km < best.km) best = { km: r.km, point: r.point };
    }
    return best;
  }

  private stemCache = new Map<Cluster, { source: LonLat; mouth: LonLat } | null>();

  /** Main stem of a river: the longest source→mouth path (side channels have their own ends). */
  private mainStem(c: Cluster): { source: LonLat; mouth: LonLat } | null {
    if (this.stemCache.has(c)) return this.stemCache.get(c)!;
    const { sources, mouths } = this.terminals(c);
    let best: { source: LonLat; mouth: LonLat; km: number } | null = null;
    for (const s of sources.slice(0, 8)) {
      for (const m of mouths.slice(0, 8)) {
        const path = this.pathBetween(c, s, m);
        const km = path ? lineLengthKm(path) : 0;
        if (!best || km > best.km) best = { source: s, mouth: m, km };
      }
    }
    const result = best ? { source: best.source, mouth: best.mouth } : null;
    this.stemCache.set(c, result);
    return result;
  }

  /** Source (no inflow) and mouth (no outflow) of a cluster, using OSM's downstream way direction. */
  private terminals(c: Cluster): { sources: LonLat[]; mouths: LonLat[] } {
    const starts = new Map<string, LonLat>();
    const endsAt = new Map<string, LonLat>();
    for (const p of c.parts) {
      starts.set(key(p.line[0]), p.line[0]);
      endsAt.set(key(p.line[p.line.length - 1]), p.line[p.line.length - 1]);
    }
    const sources = [...starts].filter(([k]) => !endsAt.has(k)).map(([, v]) => v);
    const mouths = [...endsAt].filter(([k]) => !starts.has(k)).map(([, v]) => v);
    return { sources, mouths };
  }

  /** Shortest path along the river network between two points snapped onto it. */
  private pathBetween(c: Cluster, a: LonLat, b: LonLat): LonLat[] | null {
    const adj = new Map<string, { to: string; km: number }[]>();
    const coord = new Map<string, LonLat>();
    for (const part of c.parts) {
      for (let i = 0; i < part.line.length; i++) {
        const k = key(part.line[i]);
        coord.set(k, part.line[i]);
        if (i > 0) {
          const kp = key(part.line[i - 1]);
          const km = distKm(part.line[i - 1], part.line[i]);
          push(adj, k, { to: kp, km });
          push(adj, kp, { to: k, km });
        }
      }
    }
    // Bridge near-touching part ends so the graph is connected.
    const ends = c.parts.flatMap((p) => [p.line[0], p.line[p.line.length - 1]]);
    for (let i = 0; i < ends.length; i++) {
      for (let j = i + 1; j < ends.length; j++) {
        const d = distKm(ends[i], ends[j]);
        if (d > 0 && d < 1.5) {
          push(adj, key(ends[i]), { to: key(ends[j]), km: d });
          push(adj, key(ends[j]), { to: key(ends[i]), km: d });
        }
      }
    }
    const nearest = (p: LonLat) => {
      let best = '';
      let bd = Infinity;
      for (const [k, v] of coord) {
        const d = distKm(p, v);
        if (d < bd) {
          bd = d;
          best = k;
        }
      }
      return best;
    };
    const s = nearest(a);
    const t = nearest(b);
    if (!s || !t) return null;
    if (s === t) return [coord.get(s)!];
    // Dijkstra with a simple binary heap.
    const dist = new Map<string, number>([[s, 0]]);
    const prev = new Map<string, string>();
    const heap: [number, string][] = [[0, s]];
    const pop = () => {
      const top = heap[0];
      const last = heap.pop()!;
      if (heap.length) {
        heap[0] = last;
        let i = 0;
        for (;;) {
          const l = 2 * i + 1;
          const r = l + 1;
          let m = i;
          if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
          if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
          if (m === i) break;
          [heap[i], heap[m]] = [heap[m], heap[i]];
          i = m;
        }
      }
      return top;
    };
    const pushHeap = (item: [number, string]) => {
      heap.push(item);
      let i = heap.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (heap[p][0] <= heap[i][0]) break;
        [heap[i], heap[p]] = [heap[p], heap[i]];
        i = p;
      }
    };
    while (heap.length) {
      const [d, u] = pop();
      if (u === t) break;
      if (d > (dist.get(u) ?? Infinity)) continue;
      for (const e of adj.get(u) ?? []) {
        const nd = d + e.km;
        if (nd < (dist.get(e.to) ?? Infinity)) {
          dist.set(e.to, nd);
          prev.set(e.to, u);
          pushHeap([nd, e.to]);
        }
      }
    }
    if (!dist.has(t)) return null;
    const path: LonLat[] = [];
    for (let k: string | undefined = t; k; k = prev.get(k)) path.push(coord.get(k)!);
    return path.reverse();
  }

  /** The river around a point: walk ~km in both directions along the network. */
  private stretchAround(c: Cluster, at: LonLat, km: number): LonLat[] | null {
    const ends = c.vertices.filter((v) => {
      const d = distKm(v, at);
      return d > km * 0.8 && d < km * 1.3;
    });
    if (ends.length < 2) return null;
    // Two far-apart vertices on either side of the point.
    let a = ends[0];
    let b = ends[0];
    let best = -1;
    for (const x of ends) for (const y of ends) {
      const d = distKm(x, y);
      if (d > best) {
        best = d;
        a = x;
        b = y;
      }
    }
    const path = this.pathBetween(c, a, b);
    return path && path.length > 1 ? simplify(path, 0.00008) : null;
  }

  /** Resolve one boundary phrase to a point on the river cluster. */
  private resolveBound(phrase: string, c: Cluster, other: LonLat | null, anchor: LonLat | null = null): { point: LonLat; how: string } | null {
    const b = classifyBound(phrase);
    const { sources, mouths } = this.terminals(c);
    const stem = this.mainStem(c);
    if (b.kind === 'source' && (stem || sources.length)) {
      return { point: stem?.source ?? farthestFrom(sources, other ?? mouths[0] ?? sources[0]), how: 'izvir' };
    }
    if (b.kind === 'mouth' && (stem || mouths.length)) return { point: stem?.mouth ?? farthestFrom(mouths, other ?? sources[0] ?? mouths[0]), how: 'izliv' };
    if (b.kind === 'border') {
      // The river end nearest to the other boundary (but not that boundary itself): a section
      // "from Brežice to the border" ends where the Sava leaves Slovenia, not at its source.
      const terms = [...sources, ...mouths].filter((p) => !other || distKm(p, other) > 0.5);
      if (terms.length && other) return { point: nearestTo(terms, other), how: 'meja' };
      return null;
    }
    if (b.kind === 'confluence' && b.other) {
      const longer = new RegExp(`${b.other}\\s+([a-zčšž]+)`, 'u').exec(phrase)?.[1];
      const otherNames = longer ? [`${b.other} ${longer}`, b.other] : [b.other];
      const others = otherNames.flatMap((n) => this.clusters(n)).filter((o) => o.name !== c.name);
      // Several streams share a name ("Črni potok"): prefer the meeting point near the club.
      let best: { km: number; score: number; point: LonLat } | null = null;
      for (const o of others) {
        for (const v of o.vertices) {
          const d = this.distToCluster(v, c);
          if (d.km >= 3) continue;
          const score = d.km + (anchor ? distKm(anchor, d.point) * 0.08 : 0);
          if (!best || score < best.score) best = { km: d.km, score, point: d.point };
        }
      }
      if (best) return { point: best.point, how: `sotočje ${b.other}` };
      // "izliv v X" is this river's own mouth; "izliv X" is a tributary's and needs that river.
      if (/izliv\w*\s+v\s/.test(phrase.toLowerCase()) && (stem || mouths.length)) return { point: stem?.mouth ?? farthestFrom(mouths, other ?? sources[0] ?? mouths[0]), how: 'izliv' };
      return null;
    }
    // A named place (village, dam, bridge) near the river.
    let best: { score: number; point: LonLat; how: string } | null = null;
    const own = norm(c.name);
    for (const cand of toponymCandidates(phrase)) {
      for (const variant of phraseVariants(cand)) {
        if (norm(variant) === own) continue;
        for (const pl of this.lookupPlace(variant)) {
          const d = this.distToCluster(pl.at, c);
          if (d.km > 6) continue;
          let point = d.point;
          let how = `kraj ${pl.name}`;
          if (b.structure) {
            const s = this.nearestStructure(pl.at, c, b.structure);
            if (s) {
              point = s;
              how += ` (${b.structure === 'dam' ? 'jez' : 'most'})`;
            }
          }
          // Prefer places on the river, then near the club (several villages share a name).
          const score = d.km + placeRank(pl.kind) * 0.2 + (anchor ? distKm(anchor, pl.at) * 0.08 : 0);
          if (!best || score < best.score) best = { score, point, how };
        }
      }
    }
    return best ? { point: best.point, how: best.how } : null;
  }

  /** Exact name (or abbreviation) matches, else names that start with it ("Ravne" → "Ravne na Koroškem"). */
  private lookupPlace(variant: string): OsmPoint[] {
    const k = norm(variant);
    const exact = [...(this.placesByName.get(k) ?? []), ...(this.placesByName.get(abbreviatedKey(variant)) ?? [])];
    if (exact.length || k.length < 4) return exact;
    const prefix = `${k} `;
    return this.osm.places.filter((p) => norm(p.name).startsWith(prefix));
  }

  private nearestStructure(near: LonLat, c: Cluster, kind: 'dam' | 'bridge'): LonLat | null {
    let best: { km: number; point: LonLat } | null = null;
    for (const s of this.osm.structures) {
      const isDam = s.kind === 'dam' || s.kind === 'weir';
      if ((kind === 'dam') !== isDam) continue;
      if (distKm(s.at, near) > 3) continue;
      const d = this.distToCluster(s.at, c);
      if (d.km < 0.25 && (!best || distKm(s.at, near) < best.km)) best = { km: distKm(s.at, near), point: d.point };
    }
    return best?.point ?? null;
  }

  placeRiver(input: { name: string; subtitle: string; anchor: LonLat | null; gauge: LonLat | null }): Placement {
    const notes: string[] = [];
    const wname = waterName(input.name);
    const near = input.gauge ?? input.anchor;
    // Try the name, alternative names in brackets ("Oplotniščica (Oplotnica)"), parts of
    // compound names ("Rakitnica-Obrh") and finally similar OSM names near the club.
    const candidates = [wname, ...alternateNames(input.subtitle), ...wname.split(/\s*[-/]\s*/)];
    let clusters: Cluster[] = [];
    for (const cand of candidates) {
      clusters = this.clusters(cand);
      if (clusters.length) break;
    }
    if (!clusters.length) {
      for (const cand of [wname, ...alternateNames(input.subtitle)]) {
        const fuzzy = this.fuzzyRiverNames(cand, near);
        if (fuzzy.length) {
          clusters = this.clusters(fuzzy[0]);
          notes.push(`ime v OSM: ${fuzzy[0]}`);
          break;
        }
      }
    }
    if (!clusters.length) {
      // Sections named after a lake on the river ("Ptujsko jezero") are matched as lakes.
      const lake = this.placeStill({ name: input.name, subtitle: '', anchor: input.anchor });
      if (lake.quality === 'water') return lake;
      return this.placeFallback(input, [`reka »${wname}« ni v OSM`]);
    }

    const anchor = input.gauge ?? input.anchor;
    const { from, to } = splitBounds(input.subtitle);
    // Choose the river of that name closest to the anchor, or to a resolvable boundary.
    const scored = clusters
      .map((c) => ({ c, d: anchor ? this.distToCluster(anchor, c).km : 0, len: lineLengthKm(c.vertices) }))
      .sort((a, b) => a.d - b.d || b.len - a.len);
    const c = scored[0].c;
    if (anchor && scored[0].d > 40) notes.push(`reka ${scored[0].d.toFixed(0)} km od sedeža družine`);

    // A village/confluence boundary far from the club's home area is more likely a namesake.
    // Judged against the club's home area: a gauge shown on the page can be outside the section.
    const club = input.anchor ?? input.gauge;
    const plausible = (r: { point: LonLat; how: string } | null) =>
      r && (!club || /^(izvir|izliv|meja)/.test(r.how) || distKm(club, r.point) <= MAX_BOUND_FROM_CLUB_KM) ? r : null;
    let a = from ? plausible(this.resolveBound(from, c, null, club)) : null;
    const b = to ? plausible(this.resolveBound(to, c, a?.point ?? null, club)) : null;
    if (!a && from && b) a = plausible(this.resolveBound(from, c, b.point, club));

    if (a && b) {
      const path = this.pathBetween(c, a.point, b.point);
      const tooLong = path && lineLengthKm(path) > MAX_SECTION_KM;
      if (tooLong) notes.push(`odsek zavrnjen (${Math.round(lineLengthKm(path!))} km)`);
      if (path && path.length > 1 && !tooLong) {
        const line = simplify(path, 0.00008);
        notes.push(`od: ${a.how}`, `do: ${b.how}`);
        return {
          quality: 'segment',
          geometry: { type: 'LineString', coordinates: line },
          center: midpointAlong(line),
          lengthKm: round1(lineLengthKm(path)),
          matchedWater: c.name,
          notes,
        };
      }
    }
    const one = a ?? b;
    if (one) {
      notes.push(`samo ena meja: ${one.how}`);
      return { quality: 'partial', geometry: { type: 'Point', coordinates: one.point }, center: one.point, lengthKm: null, matchedWater: c.name, notes };
    }
    const len = lineLengthKm(c.vertices);
    if (!from && !to && len < 40) {
      const line = simplify(this.pathBetween(c, ...longestSpan(c)) ?? c.parts[0].line, 0.00008);
      notes.push('cel vodotok');
      return { quality: 'water', geometry: { type: 'LineString', coordinates: line }, center: midpointAlong(line), lengthKm: round1(lineLengthKm(line)), matchedWater: c.name, notes };
    }
    // Long river, no usable boundaries: a ~10 km stretch around the gauge or the club's town.
    for (const [pt, label, q] of [
      [input.gauge, 'okoli vodomerne postaje', 'gauge'],
      [input.anchor, 'okoli sedeža družine', 'place'],
    ] as const) {
      if (!pt) continue;
      const near = this.distToCluster(pt, c);
      if (near.km > (q === 'gauge' ? 3 : 15)) continue;
      const stretch = this.stretchAround(c, near.point, 5);
      if (stretch) {
        notes.push(`odsek ${label}`);
        return { quality: q, geometry: { type: 'LineString', coordinates: stretch }, center: near.point, lengthKm: round1(lineLengthKm(stretch)), matchedWater: c.name, notes };
      }
    }
    if (input.anchor) {
      const p = this.distToCluster(input.anchor, c);
      if (p.km < 15) {
        notes.push('meje niso razrešene; točka ob reki pri sedežu družine');
        return { quality: 'place', geometry: { type: 'Point', coordinates: p.point }, center: p.point, lengthKm: null, matchedWater: c.name, notes };
      }
    }
    return { quality: 'none', geometry: null, center: null, lengthKm: null, matchedWater: c.name, notes: [...notes, 'meje niso razrešene'] };
  }

  placeStill(input: { name: string; subtitle: string; anchor: LonLat | null }): Placement {
    const names = [input.name, waterName(input.name), input.subtitle, waterName(input.subtitle)].filter(Boolean);
    const keys = new Set(names.flatMap((n) => phraseVariants(n)).map(norm).filter((k) => k.length > 2));
    // OSM has dozens of small lakes literally named "Ribnik" or "Gramoznica"; a name like that
    // says nothing about which pond a section is.
    const matches = this.osm.waters.filter((w) => {
      if (isGenericWaterName(w.name)) return false;
      const n = norm(w.name);
      return keys.has(n) || [...keys].some((k) => k.length > 5 && (n.includes(k) || k.includes(n)) && n.length > 4);
    });
    let near = matches
      .map((w) => ({ w, d: input.anchor ? distKm(input.anchor, w.centroid) : 0 }))
      .filter((x) => !input.anchor || x.d < 35)
      .sort((x, y) => x.d - y.d || y.w.areaKm2 - x.w.areaKm2);
    if (!near.length && input.anchor) {
      // Adjective forms: "Završnica" ~ "Završniško jezero", "Javorniški Rovt" ~ "Javorniško jezero".
      const stems = [...new Set(names.flatMap((n) => norm(waterName(n)).split(' ')))]
        .filter((w) => w.length >= 5 && !GENERIC_NAME_WORDS.has(w))
        .map((w) => w.slice(0, Math.max(5, w.length - 3)));
      near = this.osm.waters
        .filter((w) => !isGenericWaterName(w.name))
        .filter((w) => norm(w.name).split(' ').some((word) => stems.some((st) => word.startsWith(st))))
        .map((w) => ({ w, d: distKm(input.anchor!, w.centroid) }))
        .filter((x) => x.d < 20)
        .sort((x, y) => x.d - y.d);
    }
    if (near.length) {
      const w = near[0].w;
      return {
        quality: 'water',
        geometry: { type: 'Polygon', coordinates: [w.ring] },
        center: w.centroid,
        lengthKm: null,
        matchedWater: w.name,
        notes: [`jezero ${w.name}`],
      };
    }
    return this.placeFallback({ ...input, gauge: null }, ['jezero ni v OSM'], true);
  }

  /**
   * Last resort: a village named in the title ("Ribnik Rogoznica 1" → Rogoznica). For still
   * waters, the pond closest to that village is taken when there is one within 2 km.
   */
  private placeFallback(input: { name: string; subtitle: string; anchor: LonLat | null; gauge: LonLat | null }, notes: string[], still = false): Placement {
    const text = `${input.name} ${input.subtitle}`;
    let best: { d: number; p: OsmPoint } | null = null;
    for (const cand of withAdjectiveStems(withoutGenericPrefix(toponymCandidates(text)))) {
      if (isGenericWaterName(cand)) continue;
      for (const v of phraseVariants(cand)) {
        for (const pl of this.placesByName.get(norm(v)) ?? []) {
          const d = input.anchor ? distKm(input.anchor, pl.at) : 0;
          if (input.anchor && d > 35) continue;
          if (!best || d < best.d) best = { d, p: pl };
        }
      }
    }
    if (best) {
      const pond = still ? this.pondNear(best.p.at, 2) : null;
      if (pond) {
        return {
          quality: 'place',
          geometry: { type: 'Polygon', coordinates: [pond.ring] },
          center: pond.centroid,
          lengthKm: null,
          matchedWater: pond.name || null,
          notes: [...notes, `ribnik ob kraju ${best.p.name}`],
        };
      }
      return { quality: 'place', geometry: { type: 'Point', coordinates: best.p.at }, center: best.p.at, lengthKm: null, matchedWater: null, notes: [...notes, `kraj ${best.p.name}`] };
    }
    if (input.gauge) {
      return { quality: 'gauge', geometry: { type: 'Point', coordinates: input.gauge }, center: input.gauge, lengthKm: null, matchedWater: null, notes: [...notes, 'vodomerna postaja'] };
    }
    return { quality: 'none', geometry: null, center: null, lengthKm: null, matchedWater: null, notes };
  }

  private pondGrid: Map<string, OsmPond[]> | undefined;

  /** The still water nearest `at` within `maxKm`; larger ponds win small distance ties. */
  pondNear(at: LonLat, maxKm: number): OsmPond | null {
    const ponds = this.osm.ponds ?? [];
    if (!ponds.length) return null;
    const cell = (p: LonLat) => `${Math.floor(p[0] / 0.02)},${Math.floor(p[1] / 0.02)}`;
    if (!this.pondGrid) {
      this.pondGrid = new Map();
      for (const p of ponds) push(this.pondGrid, cell(p.centroid), p);
    }
    const [cx, cy] = cell(at).split(',').map(Number);
    let best: { score: number; p: OsmPond } | null = null;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        for (const p of this.pondGrid.get(`${cx + dx},${cy + dy}`) ?? []) {
          const d = Math.min(distKm(at, p.centroid), closestOnLine(at, p.ring).km);
          if (d > maxKm) continue;
          const score = d - 0.5 * Math.sqrt(p.areaKm2);
          if (!best || score < best.score) best = { score, p };
        }
      }
    }
    return best?.p ?? null;
  }
}

const GENERIC = new Set(['jezero', 'jezera', 'ribnik', 'ribniki', 'akumulacija', 'akumulacijsko', 'gramoznica', 'mrtvica', 'potok', 'reka', 'kanal', 'struga', 'zadrzevalnik', 'bajer']);

const GENERIC_NAME_WORDS = new Set([...GENERIC, 'kal', 'mali', 'male', 'veliki', 'velika', 'srednji', 'zgornji', 'spodnji', 'stari', 'novi', 'ribogojnica', 'bajerji', 'sljuncara', 'jezerce', 'ribnicek', 'mlaka', 'luza', 'lokev', 'lokva', 'lokve', 'pond', 'lake', 'lago', 'teich', 'see']);

/** "Ribnik", "Mali ribnik", "Gramoznica 2", "Kal": names that don't identify a water. */
export function isGenericWaterName(name: string): boolean {
  const words = norm(name).split(' ').filter((w) => w && !/^\d+$/.test(w));
  return words.length === 0 || words.every((w) => GENERIC_NAME_WORDS.has(w));
}

/** Add each candidate without its leading generic words: "Gramoznica Tržec" → also "Tržec". */
export function withoutGenericPrefix(cands: string[]): string[] {
  const out = [...cands];
  for (const c of cands) {
    const words = c.split(/\s+/);
    let i = 0;
    while (i < words.length - 1 && GENERIC_NAME_WORDS.has(norm(words[i]))) i++;
    const rest = words.slice(i).filter((w) => !/^\d+$/.test(w)).join(' ');
    if (i > 0 && rest && !out.includes(rest)) out.push(rest);
  }
  return out;
}

/** Add the town behind an adjective: "Šoštanjsko (jezero)" → Šoštanj, "Velenjsko" → Velenje. */
export function withAdjectiveStems(cands: string[]): string[] {
  const out = [...cands];
  for (const c of cands) {
    const m = /^(.+?)(?:sk|šk)(?:o|i|a|e|ega)$/u.exec(c);
    if (!m || m[1].length < 3) continue;
    for (const v of [m[1], `${m[1]}e`, `${m[1]}a`]) if (!out.includes(v)) out.push(v);
  }
  return out;
}

/** Alternative names from a subtitle that is not a boundary description ("Oplotnica", "Sušica/Pirošica"). */
export function alternateNames(subtitle: string): string[] {
  if (!subtitle || /\b(od|do)\b/i.test(subtitle)) return [];
  return subtitle
    .split(/[,/;]|\s-\s/)
    .map((x) => x.replace(/\(.*?\)|\d+/g, '').trim())
    .filter((x) => x.length > 2 && /^[A-ZČŠŽ]/.test(x));
}

function push<K, V>(m: Map<K, V[]>, k: K, v: V) {
  const arr = m.get(k);
  if (arr) arr.push(v);
  else m.set(k, [v]);
}

/** OSM river names can be bilingual ("Mura - Mur") or carry a prefix ("Potok X"). */
function riverNameKeys(name: string): string[] {
  const keys = new Set<string>([norm(name)]);
  for (const part of name.split(/\s*[/;-]\s*/)) keys.add(norm(part));
  keys.add(norm(waterName(name)));
  return [...keys].filter(Boolean);
}

function placeRank(kind: string): number {
  return ['city', 'town', 'village', 'suburb', 'hamlet', 'neighbourhood', 'locality', 'isolated_dwelling', 'quarter'].indexOf(kind) + 1 || 10;
}

const MAX_SECTION_KM = 70;
const MAX_BOUND_FROM_CLUB_KM = 25;

function nearestTo(points: LonLat[], to: LonLat): LonLat {
  return points.reduce((best, p) => (distKm(p, to) < distKm(best, to) ? p : best), points[0]);
}

function farthestFrom(points: LonLat[], from: LonLat): LonLat {
  return points.reduce((best, p) => (distKm(p, from) > distKm(best, from) ? p : best), points[0]);
}

function longestSpan(c: Cluster): [LonLat, LonLat] {
  const ends = c.parts.flatMap((p) => [p.line[0], p.line[p.line.length - 1]]);
  let best: [LonLat, LonLat] = [ends[0], ends[ends.length - 1]];
  let bd = -1;
  for (let i = 0; i < ends.length; i++) {
    for (let j = i + 1; j < ends.length; j++) {
      const d = distKm(ends[i], ends[j]);
      if (d > bd) {
        bd = d;
        best = [ends[i], ends[j]];
      }
    }
  }
  return best;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
