import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useVideoConfig, interpolate } from "remotion";
import { C, FONT, clamp, lerp, prog, easeOut, easeInOut, fadeUp, hourLabel, formatFr } from "./theme";
import { useT, Sun, Wordmark, Eyebrow, Dot, H, Muted, Phone, ImageSequence, Cover } from "./components";

export const FPS = 30;
export const DURATION_S = 40;

const seq = (dir: string, n: number, from = 0) => Array.from({ length: n }, (_, i) => `${dir}/${String(from + i).padStart(3, "0")}.jpg`);
// Close-ups of tall buildings whose shadows move. Each place covers a slice of the day.
const PLACES = [
  { name: "Cathédrale Saint-André", files: seq("hero/andre", 14), from: 7.25, to: 11.75 },
  { name: "Cathédrale Saint-André", files: seq("hero/andre2", 12), from: 11.75, to: 16.25 },
  { name: "Place Meynard · Saint-Michel", files: seq("hero/meynard", 14, 26), from: 16.25, to: 20.75 },
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
// Moments (s) when the shadows scene starts and jumps to the next place.
const CUTS = [7.8, 7.8 + 6.4 * (13.5 / 39), 7.8 + 6.4 * (25.5 / 39)];
const FLECHE = seq("hero/fleche", 9); // flèche Saint-Michel, 15h30 → 19h30
const APP = seq("app-centre", 7); // app UI over the city centre, 8h → 19h30

// Scene windows in seconds [start, end]. Scenes overlap so each one fades in over the previous.
const SC = {
  splash: [0, 4.3], grand: [4.0, 8.0], shadow: [7.6, 14.4], app: [14.0, 18.2], filters: [18.0, 22.2],
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
const fadeInOpacity = (t: number, start: number, d = 0.4) => easeInOut(prog(t, start, start + d));
const expo = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(x)));
const back = (x: number) => { const c = 1.9, y = clamp(x) - 1; return 1 + (c + 1) * y * y * y + c * y * y; };
/** Decaying impulse after time t0: 1 at t0, then fades. */
const punch = (t: number, t0: number, rate = 7) => (t < t0 ? 0 : Math.exp(-(t - t0) * rate));

/** The phone swings in from below in 3D, then floats slightly. */
const phoneIn = (t: number, t0: number): React.CSSProperties => {
  const k = expo(prog(t, t0, t0 + 1.0));
  const float = Math.sin((t - t0) * 1.6) * 6 * k;
  return { opacity: prog(t, t0, t0 + 0.2),
    transform: `perspective(2400px) translateY(${(1 - k) * 460 + float}px) rotateX(${(1 - k) * 30}deg) rotateY(${(1 - k) * -20}deg) rotateZ(${(1 - k) * -6}deg) scale(${lerp(0.8, 1, k)})` };
};
/** Pop-in with a slight overshoot, for cards and buttons. */
const popIn = (t: number, t0: number, dur = 0.55, dy = 90): React.CSSProperties => {
  const k = back(prog(t, t0, t0 + dur));
  return { opacity: prog(t, t0, t0 + 0.15), transform: `translateY(${(1 - k) * dy}px) scale(${lerp(0.92, 1, k)})` };
};
/** Headline lines that rise one after the other from behind a mask. */
const Lines: React.FC<{ t: number; t0: number; tOut?: number; stagger?: number; lines: React.ReactNode[] }> = ({ t, t0, tOut, stagger = 0.12, lines }) => (
  <>
    {lines.map((line, i) => {
      const k = expo(prog(t, t0 + i * stagger, t0 + i * stagger + 0.75));
      const ko = tOut === undefined ? 0 : easeInOut(prog(t, tOut + i * 0.05, tOut + i * 0.05 + 0.3));
      return (
        <div key={i} style={{ overflow: "hidden", paddingBottom: "0.16em", marginBottom: "-0.16em" }}>
          <div style={{ transform: `translateY(${(1 - k) * 115 - ko * 115}%) rotate(${(1 - k) * 4}deg)`, transformOrigin: "0 100%" }}>{line}</div>
        </div>
      );
    })}
  </>
);
/** Sun-yellow disc that grows from a point, covers the frame at `at`, then opens as a hole onto the next scene. */
const SunWipe: React.FC<{ at: number; cx: number; cy: number }> = ({ at, cx, cy }) => {
  const t = useT(0);
  if (t < at - 0.4 || t > at + 0.55) return null;
  const grow = Math.pow(prog(t, at - 0.4, at), 2.2) * 2400;
  const hole = expo(prog(t, at, at + 0.55) * 0.9) * 2400;
  return <AbsoluteFill style={{ background: C.sun, clipPath: `circle(${grow}px at ${cx}px ${cy}px)`,
    WebkitMaskImage: t < at ? undefined : `radial-gradient(circle at ${cx}px ${cy}px, transparent ${hole}px, #000 ${hole + 2}px)` }} />;
};

/* 1 ─ Splash, faithful to the app's launch screen */
const Splash: React.FC = () => {
  const t = useT(SC.splash[0]);
  const pulse = Math.sin((t / 2.5) * Math.PI * 2) * 0.5 + 0.5;
  const bar = t < 1.8 ? 0 : lerp(0, 100, easeInOut(prog(t, 1.8, 3.8)));
  return (
    <AbsoluteFill style={{ background: C.white, alignItems: "center", justifyContent: "center" }}>
      <Sun size={260} style={{ opacity: prog(t, 0.15, 0.3), transform: `scale(${back(prog(t, 0.15, 0.95)) * (1 + 0.035 * pulse)}) rotate(${(1 - expo(prog(t, 0.15, 1.3))) * -160 + 3 * pulse}deg)` }} />
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

/* 2 ─ Grand soleil : 3D still, slow zoom out */
const Grand: React.FC = () => {
  const t = useT(SC.grand[0]);
  const k = prog(t, 4.0, 8.0);
  return (
    <AbsoluteFill style={{ background: C.white }}>
      <ImageSequence files={FLECHE} k={k} style={{ transform: `scale(${lerp(1.3, 1.04, expo(prog(t, 4.3, 6.2)))})` }} />
      <div style={{ position: "absolute", left: 60, right: 60, bottom: 110, padding: "48px 56px 56px", background: "rgba(255,255,255,0.94)", borderRadius: 48, boxShadow: "0 24px 60px rgba(15,23,42,0.18)", ...popIn(t, 4.5) }}>
        <Eyebrow color={C.ink2} style={fadeUp(t, 4.7, 0.5, 30)}>Bordeaux · {hourLabel(lerp(15.5, 19.5, k))}</Eyebrow>
        <H size={150} style={{ marginTop: 26, lineHeight: 0.98 }}><Lines t={t} t0={4.75} lines={["Grand", <>soleil<Dot /></>]} /></H>
        <div style={{ marginTop: 30, fontFamily: FONT, fontWeight: 600, fontSize: 48, whiteSpace: "nowrap", color: C.ink2, ...fadeUp(t, 5.8, 0.6, 30) }}>
          Reste à trouver la bonne terrasse.
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* 3 ─ Calcul d'ombres 3D : the spire's shadow sweeps across the square */
const Shadows: React.FC = () => {
  const t = useT(SC.shadow[0]);
  const k = prog(t, 7.8, 14.2);
  const here = heroAt(k);
  const hv = here.hour;
  const pct = ((hv - 6) / 15) * 100;
  // Camera punch and flash each time the place changes (on the beat).
  const hit = Math.max(...CUTS.map((c) => punch(t, c)));
  return (
    <AbsoluteFill style={{ background: C.white, opacity: fadeInOpacity(t, 7.6, 0.25) }}>
      <ImageSequence files={HERO} k={k} style={{ transform: `scale(${lerp(1.04, 1.12, k) + 0.1 * hit})` }} />
      <AbsoluteFill style={{ background: C.white, opacity: 0.5 * Math.max(...CUTS.map((c) => punch(t, c, 16))) }} />
      <div style={{ position: "absolute", left: 200, top: 110, width: 680, padding: "30px 46px 34px", background: "rgba(255,255,255,0.94)",
        borderRadius: 36, boxShadow: "0 18px 50px rgba(15,23,42,0.16)", fontFamily: FONT, ...popIn(t, 8.0, 0.55, -90) }}>
        <div style={{ textAlign: "center", fontWeight: 800, fontSize: 64, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums", color: C.ink }}>
          <span style={{ color: "#F5A524" }}>☀</span>&nbsp;{hourLabel(hv)}
          <div style={{ marginTop: 6, fontSize: 26, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.ink3, transform: `scale(${1 + 0.12 * hit})` }}>
            {here.name}
          </div>
        </div>
        <div style={{ position: "relative", height: 10, background: "#E5E7EB", borderRadius: 6, marginTop: 22 }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: C.accent, borderRadius: 6 }} />
          <div style={{ position: "absolute", top: "50%", left: `${pct}%`, width: 44, height: 44, margin: "-22px 0 0 -22px", borderRadius: "50%",
            background: C.white, border: `6px solid ${C.accent}`, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, fontSize: 24, color: C.ink3, fontWeight: 600 }}><span>6h</span><span>21h</span></div>
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, bottom: 110, padding: "48px 56px 56px", background: "rgba(255,255,255,0.94)", borderRadius: 48, boxShadow: "0 24px 60px rgba(15,23,42,0.18)", ...popIn(t, 8.05) }}>
        <Eyebrow color={C.ink2} style={fadeUp(t, 8.1, 0.5, 30)}>Calcul d’ombres 3D</Eyebrow>
        <H size={118} style={{ marginTop: 26 }}><Lines t={t} t0={8.3} lines={[<>Chaque immeuble<Dot /></>]} /></H>
        <H size={118} style={{ color: C.ink3 }}><Lines t={t} t0={9.0} lines={[<>Chaque heure<Dot /></>]} /></H>
      </div>
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
        <H size={88} style={{ marginTop: 24 }}><Lines t={t} t0={14.35} lines={["Toutes les terrasses", <Muted>autour de toi.</Muted>]} /></H>
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
              opacity: k, transform: `translateY(${(1 - k) * 30}px) scale(${1 + (on ? 0.16 * punch(t, s0 + j * beat, 6) : 0)})` }}><span>{emoji}</span>{label}</div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 880, left: 0, right: 0, height: 300, overflow: "hidden" }}>
        {FILTERS.map(([, , word], j) => {
          const a = s0 + j * beat;
          const kin = back(prog(t, a, a + 0.45));
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
      {/* burst when the total lands */}
      {[0, 0.12].map((d) => { const b = prog(t, 25.3 + d, 25.95 + d); const size = 300 + expo(b) * 1500;
        return <div key={d} style={{ position: "absolute", left: 540 - size / 2, top: 1085 - size / 2, width: size, height: size, borderRadius: "50%",
          border: `${lerp(26, 2, b)}px solid ${C.sun}`, opacity: t < 25.3 + d ? 0 : 1 - b }} />; })}
      <div style={{ position: "absolute", top: 960, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontWeight: 900, fontSize: 250, letterSpacing: "-0.05em", lineHeight: 1, color: C.ink, fontVariantNumeric: "tabular-nums", transform: `scale(${1 + 0.1 * pop})` }}>
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
const TRIO: [React.ReactNode[], string][] = [
  [[<>Gratuit<Dot /></>], "Ouvre, regarde, profite."],
  [["Sans", <>compte<Dot /></>], "Pas d’inscription, pas d’email."],
  [["Zéro", <>donnée<Dot /></>], "Ta position reste sur ton téléphone."],
];
const Trio: React.FC = () => {
  const t = useT(SC.trio[0]);
  return (
    <AbsoluteFill style={{ background: C.white, fontFamily: FONT }}>
      {TRIO.map(([big, sub], i) => {
        const t0 = 26.0 + i * 1.25;
        const ko = i < 2 ? easeInOut(prog(t, t0 + 1.08, t0 + 1.3)) : 0;
        return (
          <div key={i} style={{ position: "absolute", left: 110, right: 110, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center",
            opacity: t < t0 ? 0 : 1 - ko, transform: `translateY(${-ko * 120}px)` }}>
            <div style={{ fontWeight: 700, fontSize: 34, color: C.ink3, letterSpacing: "0.1em", marginBottom: 40, fontVariantNumeric: "tabular-nums", ...fadeUp(t, t0 + 0.05, 0.4, 20) }}>0{i + 1} / 03</div>
            <div style={{ fontWeight: 900, fontSize: 190, letterSpacing: "-0.055em", lineHeight: 0.95, color: C.ink }}><Lines t={t} t0={t0 + 0.05} stagger={0.09} lines={big} /></div>
            <div style={{ marginTop: 40, fontWeight: 600, fontSize: 50, color: C.ink2, ...fadeUp(t, t0 + 0.35, 0.45, 30) }}>{sub}</div>
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
  return <div style={{ position: "absolute", zIndex: 5, border: `5px solid ${C.sun}`, borderRadius: round ? "50%" : 22, opacity, transform: `scale(${lerp(1.35, 1, back(opacity))})`,
    left: cx + (x * S_ - cx) * zoom - 8, top: cy + (y * S_ - cy) * zoom - 8, width: w * S_ * zoom + 16, height: h * S_ * zoom + 16 }} />;
};
const Pro: React.FC = () => {
  const t = useT(SC.pro[0]);
  const z = lerp(1, 1.04, prog(t, 29.6, 31.6));
  return (
    <AbsoluteFill style={{ background: C.white, opacity: fadeInOpacity(t, 29.6) }}>
      <div style={{ position: "absolute", left: 80, right: 80, top: 130 }}>
        <Eyebrow style={fadeUp(t, 29.8, 0.5, 30)}>Restaurateurs</Eyebrow>
        <H size={84} style={{ marginTop: 24 }}><Lines t={t} t0={29.95} tOut={31.15} lines={["Votre terrasse,", <Muted>en étoile sur la 3D.</Muted>]} /></H>
        <H size={84} style={{ position: "absolute", left: 0, right: 0, top: 58 }}><Lines t={t} t0={31.45} tOut={33.15} lines={["Votre fiche avec photo,", <Muted>réservation et appel.</Muted>]} /></H>
        <H size={84} style={{ position: "absolute", left: 0, right: 0, top: 58 }}><Lines t={t} t0={33.45} lines={["Rejoignez", <Muted>la Sélection.</Muted>]} /></H>
      </div>
      <Phone style={phoneIn(t, 29.7)}>
        <Cover file="app/014.jpg" style={{ transform: `scale(${z})`, transformOrigin: "50% 30%" }} />
        {/* the place page slides up like the app's sheet */}
        <AbsoluteFill style={{ background: C.white, zIndex: 3, transform: `translateY(${(1 - expo(prog(t, 31.3, 32.0))) * 1300}px)`,
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
  const pulse = Math.sin(((t - 33) / 2.5) * Math.PI * 2) * 0.5 + 0.5;
  return (
    <AbsoluteFill style={{ background: C.white, alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
      <Sun size={220} style={{ opacity: prog(t, 33.15, 33.3), transform: `scale(${back(prog(t, 33.15, 33.95)) * (1 + 0.035 * pulse)}) rotate(${(1 - expo(prog(t, 33.15, 34.3))) * -160 + 3 * pulse}deg)` }} />
      <Wordmark size={108} style={{ marginTop: 60, ...fadeUp(t, 33.7, 0.7, 30) }} />
      <div style={{ marginTop: 34, fontWeight: 700, fontSize: 66, letterSpacing: "-0.045em", color: C.ink2 }}>
        <Lines t={t} t0={34.25} lines={[<>Le soleil, c’est <span style={{ color: C.accent }}>maintenant</span>.</>]} />
      </div>
      <div style={{ marginTop: 90, display: "flex", flexDirection: "column", alignItems: "center", gap: 30, ...popIn(t, 35.0, 0.6, 60) }}>
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
      <SunWipe at={4.3} cx={540} cy={781} />
      <SunWipe at={26.0} cx={540} cy={1085} />
      <SunWipe at={34.8} cx={540} cy={690} />
      <Audio src={staticFile("music.mp3")} volume={(f) => interpolate(f, [0, 0.4 * fps], [0, 1], { extrapolateRight: "clamp" })} />
    </AbsoluteFill>
  );
};
