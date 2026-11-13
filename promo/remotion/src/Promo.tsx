import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useVideoConfig, interpolate } from "remotion";
import { C, FONT, clamp, lerp, prog, easeOut, easeInOut, fadeUp, hourLabel, formatFr } from "./theme";
import { useT, Sun, Wordmark, Eyebrow, Dot, H, Phone, ImageSequence, Cover } from "./components";

export const FPS = 30;
export const DURATION_S = 40;

const seq = (dir: string, n: number, from = 0) => Array.from({ length: n }, (_, i) => `${dir}/${String(from + i).padStart(3, "0")}.jpg`);
// Close-ups of tall buildings whose shadows move. Each place covers a slice of the day.
const PLACES = [
  { name: "Cathédrale Saint-André", files: seq("hero/andre", 14), from: 7.25, to: 11.75 },
  { name: "Cathédrale Saint-André", files: seq("hero/andre2", 11), from: 11.75, to: 15.85 },
  { name: "Flèche Saint-Michel", files: seq("hero/fleche", 8, 1), from: 16, to: 19.5 },
];
const HERO = PLACES.flatMap((pl) => pl.files);
/** Place and hour shown at progress k of the HERO sequence. */
const heroAt = (k: number) => {
  let f = clamp(k) * (HERO.length - 1);
  for (const pl of PLACES) {
    if (f <= pl.files.length - 0.5 || pl === PLACES[PLACES.length - 1]) return { name: pl.name, hour: lerp(pl.from, pl.to, clamp(f / (pl.files.length - 1))) };
    f -= pl.files.length;
  }
  return { name: "", hour: 0 };
};
const APP = seq("app-centre", 7); // app UI over the city centre, 8h → 19h30

// Scene windows in seconds [start, end]. Scenes overlap so each one fades in over the previous.
const SC = {
  splash: [0, 4.6], grand: [4.0, 8.0], shadow: [7.6, 14.4], app: [14.0, 18.2], filters: [18.0, 22.2],
  count: [22.0, 26.2], trio: [26.0, 29.8], pro: [29.6, 35.2], end: [34.8, 40.0],
} as const;

const Scene: React.FC<{ win: readonly [number, number]; children: React.ReactNode }> = ({ win, children }) => {
  const { fps } = useVideoConfig();
  return <Sequence from={Math.round(win[0] * fps)} durationInFrames={Math.round((win[1] - win[0]) * fps)}>{children}</Sequence>;
};
/** Holds each frame, then cross-fades quickly to the next, so the app's clock stays readable. */
const stepped = (k: number, steps: number) => {
  const f = clamp(k) * steps, i = Math.min(steps - 1, Math.floor(f));
  return (i + clamp((f - i - 0.35) / 0.3)) / steps;
};
const expo = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(x)));
const back = (x: number) => { const c = 2.4, y = clamp(x) - 1; return 1 + (c + 1) * y * y * y + c * y * y; };
type Line = { text: string; muted?: boolean; dot?: boolean; accent?: string };
/** Kinetic headline: each word rises from behind a mask, one after the other; the yellow dot pops in last. */
const Kinetic: React.FC<{ t: number; t0: number; tOut?: number; stagger?: number; lines: Line[] }> = ({ t, t0, tOut, stagger = 0.075, lines }) => {
  let n = 0;
  const mask: React.CSSProperties = { display: "inline-block", overflow: "hidden", verticalAlign: "top", paddingBottom: "0.18em", marginBottom: "-0.18em" };
  return (
    <>
      {lines.map((line, li) => {
        const words = line.text.split(" ");
        return (
          <div key={li} style={{ color: line.muted ? C.ink3 : undefined, whiteSpace: "nowrap" }}>
            {words.map((w, wi) => {
              const a = t0 + n++ * stagger;
              const k = expo(prog(t, a, a + 0.7));
              const ko = tOut === undefined ? 0 : easeInOut(prog(t, tOut + li * 0.05, tOut + li * 0.05 + 0.3));
              const last = wi === words.length - 1;
              return (
                <span key={wi} style={{ ...mask, marginRight: last ? 0 : "0.2em" }}>
                  <span style={{ display: "inline-block", transform: `translateY(${(1 - k) * 112 - ko * 112}%)`, color: line.accent && w.startsWith(line.accent) ? C.accent : undefined }}>
                    {w}
                    {last && line.dot && <span style={{ display: "inline-block", color: C.accent, transform: `scale(${back(prog(t, a + 0.3, a + 0.75))})`, transformOrigin: "50% 85%" }}>.</span>}
                  </span>
                </span>
              );
            })}
          </div>
        );
      })}
    </>
  );
};
const fadeInOpacity = (t: number, start: number, d = 0.4) => easeInOut(prog(t, start, start + d));
const phoneIn = (t: number, t0: number): React.CSSProperties => {
  const k = easeOut(prog(t, t0, t0 + 0.8));
  return { opacity: k, transform: `translateY(${(1 - k) * 240}px)` };
};

/* 1 ─ Splash, faithful to the app's launch screen */
const Splash: React.FC = () => {
  const t = useT(SC.splash[0]);
  const pulse = Math.sin((t / 2.5) * Math.PI * 2) * 0.5 + 0.5;
  const ks = easeOut(prog(t, 0.15, 1.0));
  const bar = t < 1.8 ? 0 : lerp(0, 100, easeInOut(prog(t, 1.8, 3.8)));
  return (
    <AbsoluteFill style={{ background: C.white, alignItems: "center", justifyContent: "center", opacity: 1 - easeInOut(prog(t, 4.0, 4.6)) }}>
      <Sun size={260} style={{ opacity: ks, transform: `scale(${lerp(0.85, 1, ks) * (1 + 0.035 * pulse)}) rotate(${3 * pulse}deg)` }} />
      <Wordmark size={108} style={{ marginTop: 70, ...fadeUp(t, 0.7, 0.7, 30) }} />
      <div style={{ marginTop: 34, fontFamily: "Arial, sans-serif", fontSize: 46, color: C.ink2, textAlign: "center", lineHeight: 1.4, ...fadeUp(t, 1.2, 0.7, 30) }}>
        Les terrasses au soleil,<br /><strong style={{ color: C.accent }}>en temps réel.</strong>
      </div>
      <div style={{ position: "absolute", bottom: 170, left: 360, width: 360, opacity: easeOut(prog(t, 1.6, 2.0)) }}>
        <div style={{ height: 5, background: "#E5E5EA", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${bar}%`, background: C.accent }} />
        </div>
        <div style={{ marginTop: 28, textAlign: "center", fontSize: 28, color: C.ink3, fontFamily: "Arial, sans-serif" }}>
          {t < 2.6 ? "Chargement…" : t < 3.8 ? "La 3D se prépare…" : "Prêt !"}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* 2 ─ Grand soleil : a real Bordeaux terrace (filmed by the owner) */
const Grand: React.FC = () => {
  const t = useT(SC.grand[0]);
  const k = prog(t, 4.0, 8.0);
  return (
    <AbsoluteFill style={{ background: C.white }}>
      <OffthreadVideo src={staticFile("terrasse.mp4")} muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
        transform: `scale(${lerp(1.0, 1.07, k)})`, transformOrigin: "60% 65%" }} />
      <div style={{ position: "absolute", left: 60, right: 60, top: 110, padding: "48px 56px 56px", background: "rgba(255,255,255,0.94)", borderRadius: 48, boxShadow: "0 24px 60px rgba(15,23,42,0.18)", ...fadeUp(t, 4.4, 0.5, -40) }}>
        <Eyebrow color={C.ink2} style={fadeUp(t, 4.4, 0.5, 30)}>Bordeaux · en terrasse</Eyebrow>
        <H size={150} style={{ marginTop: 26, lineHeight: 0.98 }}><Kinetic t={t} t0={4.6} stagger={0.14} lines={[{ text: "Grand" }, { text: "soleil", dot: true }]} /></H>
        <div style={{ marginTop: 30, fontFamily: FONT, fontWeight: 600, fontSize: 48, whiteSpace: "nowrap", color: C.ink2, ...fadeUp(t, 5.8, 0.6, 30) }}>
          Reste à trouver la bonne terrasse.
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** The app's time slider (.panel-map in index.html), scaled 393 px → 1080 px. It moves in 15-minute steps like the real one. */
const TimePanel: React.FC<{ hour: number; style?: React.CSSProperties }> = ({ hour, style }) => {
  const q = Math.round(hour * 4) / 4;
  const pct = clamp((q - 6) / 15);
  const W = 886 - 2 * 66, THUMB = 66;
  return (
    <div style={{ position: "absolute", left: 97, bottom: 137, width: 886, padding: "44px 66px 38px", borderRadius: 60, background: "rgba(255,255,255,0.9)",
      backdropFilter: "blur(66px) saturate(1.15)", border: "3px solid rgba(255,255,255,0.7)",
      boxShadow: "0 38px 104px rgba(15,23,42,0.13), inset 0 3px 0 rgba(255,255,255,0.86)", fontFamily: FONT, ...style }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 22, marginBottom: 33 }}>
        <Sun size={58} />
        <span style={{ fontSize: 50, fontWeight: 800, color: C.ink, fontVariantNumeric: "tabular-nums" }}>{hourLabel(q)}</span>
      </div>
      <div style={{ position: "relative", height: THUMB, display: "flex", alignItems: "center" }}>
        <div style={{ width: "100%", height: 11, borderRadius: 6, background: `linear-gradient(to right, ${C.accent} ${pct * 100}%, rgba(0,0,0,0.1) ${pct * 100}%)` }} />
        <div style={{ position: "absolute", left: pct * (W - THUMB), top: 0, width: THUMB, height: THUMB, borderRadius: "50%", background: C.white,
          border: `8px solid ${C.accent}`, boxShadow: "0 11px 44px rgba(0,0,0,0.18)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, fontSize: 27, fontWeight: 500, color: C.ink3 }}><span>6h</span><span>20h</span></div>
    </div>
  );
};

/* 3 ─ Calcul d'ombres 3D : the spire's shadow sweeps across the square */
const Shadows: React.FC = () => {
  const t = useT(SC.shadow[0]);
  const k = prog(t, 7.8, 14.2);
  const here = heroAt(k);
  const hv = here.hour;
  return (
    <AbsoluteFill style={{ background: C.white, opacity: fadeInOpacity(t, 7.6) }}>
      <ImageSequence files={HERO} k={k} style={{ transform: `scale(${lerp(1.04, 1.12, k)})` }} />
      <div style={{ position: "absolute", left: 60, right: 60, top: 110, padding: "48px 56px 56px", background: "rgba(255,255,255,0.94)", borderRadius: 48, boxShadow: "0 24px 60px rgba(15,23,42,0.18)", ...fadeUp(t, 8.0, 0.5, -40) }}>
        <Eyebrow color={C.ink2} style={fadeUp(t, 8.1, 0.5, 30)}>Calcul d’ombres 3D</Eyebrow>
        <H size={104} style={{ marginTop: 26 }}><Kinetic t={t} t0={8.3} stagger={0.12} lines={[{ text: "Chaque immeuble", dot: true }]} /></H>
        <H size={104}><Kinetic t={t} t0={9.0} stagger={0.12} lines={[{ text: "Chaque heure", muted: true, dot: true }]} /></H>
      </div>
      {/* location pill, as in the app */}
      <div style={{ position: "absolute", top: 536, left: 0, right: 0, display: "flex", justifyContent: "center", ...fadeUp(t, 8.4, 0.5, -20) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "20px 34px", borderRadius: 999, background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(50px)", boxShadow: "0 22px 66px rgba(15,23,42,0.18)", fontFamily: FONT, fontWeight: 800, fontSize: 36, color: C.ink }}>
          <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#007AFF", boxShadow: "0 0 0 11px rgba(0,122,255,0.14)" }} />
          {here.name}
        </div>
      </div>
      <TimePanel hour={hv} style={fadeUp(t, 8.0, 0.6, 60)} />
    </AbsoluteFill>
  );
};

/* 4 ─ L'appli */
const App: React.FC = () => {
  const t = useT(SC.app[0]);
  return (
    <AbsoluteFill style={{ background: C.white, opacity: fadeInOpacity(t, 14.0) }}>
      <div style={{ position: "absolute", left: 80, right: 80, top: 130, textAlign: "center" }}>
        <Eyebrow style={fadeUp(t, 14.2, 0.5, 30)}>L’appli</Eyebrow>
        <H size={88} style={{ marginTop: 24 }}><Kinetic t={t} t0={14.35} lines={[{ text: "Toutes les terrasses" }, { text: "autour de toi.", muted: true }]} /></H>
      </div>
      <Phone style={phoneIn(t, 14.1)}><ImageSequence files={APP} k={stepped(prog(t, 14.5, 18.0), APP.length - 1)} /></Phone>
    </AbsoluteFill>
  );
};

/* 5 ─ Filtre ce qui te fait envie (typographic) */
const FILTERS: [string, string, string][] = [["☕", "Cafés", "Un café"], ["🍴", "Restaurants", "Un déj’"], ["🍹", "Bars", "L’apéro"], ["🌊", "Canicule", "Au frais"]];
const Filters: React.FC = () => {
  const t = useT(SC.filters[0]);
  const beat = 0.95, s0 = 18.4;
  const active = clamp(Math.floor((t - s0) / beat), 0, 3);
  return (
    <AbsoluteFill style={{ background: C.white, opacity: fadeInOpacity(t, 18.0, 0.3), fontFamily: FONT }}>
      <Eyebrow style={{ position: "absolute", top: 200, left: 0, right: 0, textAlign: "center", ...fadeUp(t, 18.1, 0.5, 30) }}>Filtre ce qui te fait envie</Eyebrow>
      <div style={{ position: "absolute", top: 560, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 12 }}>
        {FILTERS.map(([emoji, label], j) => {
          const k = easeOut(prog(t, 18.15 + j * 0.08, 18.6 + j * 0.08));
          const on = j === active && t >= s0;
          return (
            <div key={label} style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 22px", whiteSpace: "nowrap", borderRadius: 999,
              fontWeight: 700, fontSize: 31, background: on ? C.ink : C.white, color: on ? C.white : C.ink, border: `2px solid ${on ? C.ink : C.line}`,
              opacity: k, transform: `translateY(${(1 - k) * 30}px)` }}><span>{emoji}</span>{label}</div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 880, left: 0, right: 0, height: 300, overflow: "hidden" }}>
        {FILTERS.map(([, , word], j) => {
          const a = s0 + j * beat;
          const kin = easeOut(prog(t, a, a + 0.35));
          const kout = j < 3 ? easeInOut(prog(t, a + beat, a + beat + 0.3)) : 0;
          return (
            <div key={word} style={{ position: "absolute", left: 0, right: 0, textAlign: "center", fontSize: 230, lineHeight: "300px", fontWeight: 900,
              letterSpacing: "-0.055em", color: C.ink, opacity: t < a ? 0 : 1 - kout, transform: `translateY(${(1 - kin) * 300 - kout * 300}px)` }}>
              {word}<Dot />
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 1240, left: 0, right: 0, textAlign: "center", fontWeight: 600, fontSize: 44, color: C.ink3, ...fadeUp(t, 18.6, 0.6, 30) }}>
        au soleil, à l’heure que tu veux.
      </div>
    </AbsoluteFill>
  );
};

/* 6 ─ Partout en France : the counter adds each city as it passes (data/*.json) */
const CITIES: [string, number][] = [["Bordeaux", 1531], ["Lyon", 2643], ["Marseille", 1420], ["Toulouse", 1356], ["Nice", 1126], ["Nantes", 1043], ["Lille", 1030], ["Strasbourg", 1015], ["Cannes", 318]];
const TOTAL = CITIES.reduce((a, c) => a + c[1], 0); // 11 482
const Count: React.FC = () => {
  const t = useT(SC.count[0]);
  const rows: [string, number][] = [...CITIES, ["Paris · Montpellier", 0]];
  const pos = easeInOut(prog(t, 22.4, 25.3)) * (rows.length - 1);
  const ip = Math.floor(pos), fr = pos - ip;
  let cum = 0;
  CITIES.forEach(([, n], i) => { if (i <= ip) cum += n; else if (i === ip + 1) cum += n * easeOut(fr); });
  cum = Math.min(TOTAL, cum * easeOut(prog(t, 22.1, 22.5)));
  if (t >= 25.3) cum = TOTAL;
  const pop = easeOut(prog(t, 25.3, 25.6)) * (1 - easeOut(prog(t, 25.6, 26.0)));
  return (
    <AbsoluteFill style={{ background: C.white, opacity: fadeInOpacity(t, 22.0), fontFamily: FONT }}>
      <Eyebrow style={{ position: "absolute", top: 200, left: 0, right: 0, textAlign: "center", ...fadeUp(t, 22.1, 0.5, 30) }}>Partout en France</Eyebrow>
      <div style={{ position: "absolute", left: 0, right: 0, top: 330, height: 560, overflow: "hidden",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, #000 30%, #000 70%, transparent 100%)" }}>
        {rows.map(([c, n], i) => {
          const d = i - pos, a = clamp(1 - Math.abs(d) * 0.55);
          return (
            <div key={c} style={{ position: "absolute", left: 0, right: 0, top: 280 - 56 + d * 112, height: 112, display: "flex", alignItems: "center",
              justifyContent: "center", gap: 28, opacity: 0.25 + 0.75 * a, transform: `scale(${0.86 + 0.14 * a})` }}>
              <span style={{ whiteSpace: "nowrap", fontWeight: 800, fontSize: 84, letterSpacing: "-0.04em", color: Math.abs(d) < 0.5 ? C.ink : C.ink3 }}>{c}</span>
              {n > 0 && <span style={{ fontWeight: 700, fontSize: 40, color: C.gold, background: C.sunBg, padding: "8px 20px", borderRadius: 999 }}>+{formatFr(n)}</span>}
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 960, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontWeight: 900, fontSize: 250, letterSpacing: "-0.05em", lineHeight: 1, color: C.ink, fontVariantNumeric: "tabular-nums", transform: `scale(${1 + 0.06 * pop})` }}>
          {formatFr(Math.round(cum))}
        </div>
        <div style={{ width: 640, height: 8, margin: "44px auto 0", background: "#F1F2F4", borderRadius: 6, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(cum / TOTAL) * 100}%`, background: C.sun }} />
        </div>
        <div style={{ marginTop: 44, fontWeight: 700, fontSize: 62, letterSpacing: "-0.03em", color: C.ink, opacity: easeOut(prog(t, 22.3, 22.8)) }}>terrasses &amp; lieux référencés</div>
      </div>
    </AbsoluteFill>
  );
};

/* 7 ─ Gratuit. Sans compte. Zéro donnée. */
const TRIO: [Line[], string][] = [
  [[{ text: "Gratuit", dot: true }], "Ouvre, regarde, profite."],
  [[{ text: "Sans" }, { text: "compte", dot: true }], "Pas d’inscription, pas d’email."],
  [[{ text: "Zéro" }, { text: "donnée", dot: true }], "Ta position reste sur ton téléphone."],
];
const Trio: React.FC = () => {
  const t = useT(SC.trio[0]);
  return (
    <AbsoluteFill style={{ background: C.white, opacity: fadeInOpacity(t, 26.0, 0.25), fontFamily: FONT }}>
      {TRIO.map(([big, sub], i) => {
        const t0 = 26.0 + i * 1.25;
        const ko = i < 2 ? easeInOut(prog(t, t0 + 1.1, t0 + 1.3)) : 0;
        return (
          <div key={i} style={{ position: "absolute", left: 110, right: 110, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center",
            opacity: t < t0 ? 0 : 1 - ko, transform: `translateY(${-ko * 90}px)` }}>
            <div style={{ fontWeight: 700, fontSize: 34, color: C.ink3, letterSpacing: "0.1em", marginBottom: 40, fontVariantNumeric: "tabular-nums", ...fadeUp(t, t0, 0.4, 20) }}>0{i + 1} / 03</div>
            <div style={{ fontWeight: 900, fontSize: 190, letterSpacing: "-0.055em", lineHeight: 0.95, color: C.ink }}><Kinetic t={t} t0={t0 + 0.05} stagger={0.12} lines={big} /></div>
            <div style={{ marginTop: 40, fontWeight: 600, fontSize: 50, color: C.ink2, ...fadeUp(t, t0 + 0.4, 0.45, 30) }}>{sub}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* 8 ─ Restaurateurs : La Mère Michel as the example */
const S = 592 / 1179; // capture px → phone screen px
const STAR = [489, 1329, 120, 120];
// La Mère Michel's place page, screenshot from the app (978 px wide).
const SHEET_S = 592 / 978;
const BADGE = [40, 645, 445, 43], BOOK = [40, 1045, 286, 120];
const Ring: React.FC<{ box: number[]; zoom: number; round?: boolean; opacity: number; scale?: number }> = ({ box: [x, y, w, h], zoom, round, opacity, scale = S }) => {
  const cx = 296, cy = 1283 * 0.3;
  const S_ = scale;
  return <div style={{ position: "absolute", zIndex: 5, border: `5px solid ${C.sun}`, borderRadius: round ? "50%" : 22, opacity,
    left: cx + (x * S_ - cx) * zoom - 8, top: cy + (y * S_ - cy) * zoom - 8, width: w * S_ * zoom + 16, height: h * S_ * zoom + 16 }} />;
};
const Pro: React.FC = () => {
  const t = useT(SC.pro[0]);
  const z = lerp(1, 1.04, prog(t, 29.6, 31.6));
  return (
    <AbsoluteFill style={{ background: C.white, opacity: fadeInOpacity(t, 29.6) }}>
      <div style={{ position: "absolute", left: 80, right: 80, top: 130 }}>
        <Eyebrow style={fadeUp(t, 29.8, 0.5, 30)}>Restaurateurs</Eyebrow>
        <H size={84} style={{ marginTop: 24 }}><Kinetic t={t} t0={29.95} tOut={31.1} lines={[{ text: "Votre terrasse," }, { text: "en étoile sur la 3D.", muted: true }]} /></H>
        <H size={84} style={{ position: "absolute", left: 0, right: 0, top: 58 }}><Kinetic t={t} t0={31.45} tOut={33.1} lines={[{ text: "Votre fiche avec photo," }, { text: "réservation et appel.", muted: true }]} /></H>
        <H size={84} style={{ position: "absolute", left: 0, right: 0, top: 58 }}><Kinetic t={t} t0={33.45} lines={[{ text: "Rejoignez" }, { text: "la Sélection.", muted: true }]} /></H>
      </div>
      <Phone style={phoneIn(t, 29.7)}>
        <Cover file="app/014.jpg" style={{ transform: `scale(${z})`, transformOrigin: "50% 30%" }} />
        {/* the place page slides up like the app's sheet */}
        <AbsoluteFill style={{ background: C.white, zIndex: 3, transform: `translateY(${(1 - easeOut(prog(t, 31.3, 31.8))) * 1300}px)`,
          }}>
          <Img src={staticFile("ui/mere-michel.jpg")} style={{ position: "absolute", left: 0, top: 0, width: "100%" }} />
          <Ring box={BADGE} zoom={1} scale={SHEET_S} opacity={easeOut(prog(t, 32.0, 32.3)) * (1 - prog(t, 33.0, 33.2))} />
          <Ring box={BOOK} zoom={1} scale={SHEET_S} opacity={easeOut(prog(t, 32.5, 32.8)) * (1 - prog(t, 33.0, 33.2))} />
        </AbsoluteFill>
        <Ring box={STAR} zoom={z} round opacity={easeOut(prog(t, 30.6, 30.9)) * (1 - prog(t, 31.2, 31.4))} />
      </Phone>
    </AbsoluteFill>
  );
};

/* 9 ─ Fin */
const End: React.FC = () => {
  const t = useT(SC.end[0]) - 1.8; // timings below were written for a start at 33 s
  const ks = easeOut(prog(t, 33.2, 34.1));
  const pulse = Math.sin(((t - 33) / 2.5) * Math.PI * 2) * 0.5 + 0.5;
  return (
    <AbsoluteFill style={{ background: C.white, opacity: fadeInOpacity(t, 33.0), alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
      <Sun size={220} style={{ opacity: ks, transform: `scale(${lerp(0.85, 1, ks) * (1 + 0.035 * pulse)}) rotate(${3 * pulse}deg)` }} />
      <Wordmark size={108} style={{ marginTop: 60, ...fadeUp(t, 33.7, 0.7, 30) }} />
      <div style={{ marginTop: 34, fontWeight: 700, fontSize: 66, letterSpacing: "-0.045em", color: C.ink2 }}>
        <Kinetic t={t} t0={34.25} stagger={0.1} lines={[{ text: "Le soleil, c’est maintenant.", accent: "maintenant" }]} />
      </div>
      <div style={{ marginTop: 90, display: "flex", flexDirection: "column", alignItems: "center", gap: 30, ...fadeUp(t, 35.0, 0.7, 30) }}>
        <div style={{ padding: "26px 54px", borderRadius: 999, background: C.ink, color: C.white, fontWeight: 700, fontSize: 42 }}>Lien en bio ↗</div>
        <div style={{ fontSize: 34, color: C.ink3, fontWeight: 600 }}>Gratuit sur l’App Store</div>
      </div>
      <AbsoluteFill style={{ background: "#000", opacity: prog(t, 37.2, 38) }} />
    </AbsoluteFill>
  );
};

export const Promo: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ background: C.white }} />
      <Scene win={SC.grand}><Grand /></Scene>
      <Scene win={SC.shadow}><Shadows /></Scene>
      <Scene win={SC.app}><App /></Scene>
      <Scene win={SC.filters}><Filters /></Scene>
      <Scene win={SC.count}><Count /></Scene>
      <Scene win={SC.trio}><Trio /></Scene>
      <Scene win={SC.pro}><Pro /></Scene>
      <Scene win={SC.end}><End /></Scene>
      <Scene win={SC.splash}><Splash /></Scene>
      <Audio src={staticFile("music.mp3")} volume={(f) => interpolate(f, [0, 0.4 * fps], [0, 1], { extrapolateRight: "clamp" })} />
    </AbsoluteFill>
  );
};
