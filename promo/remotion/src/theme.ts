// Palette and type taken from the app itself (index.html :root and splash screen).
export const C = {
  ink: "#15171A",
  ink2: "#5E6470",
  ink3: "#9AA1AD",
  sun: "#FFD600",
  accent: "#F8C83E",
  gold: "#B58B00",
  sunBg: "#FFF7D6",
  line: "#E4E7EC",
  white: "#FFFFFF",
};
export const FONT = "Inter, -apple-system, 'SF Pro Display', 'Segoe UI', sans-serif";
export const WORDMARK_FONT = "Arial, Helvetica, sans-serif";

// Timing helpers, all in seconds.
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);
export const easeInOut = (t: number) => (t < 0.5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2);

/** Fade + slide up in at t0; optionally fade + slide up out at tOut. */
export const fadeUp = (t: number, t0: number, dur = 0.6, dy = 40, tOut: number | null = null): React.CSSProperties => {
  const k = easeOut(prog(t, t0, t0 + dur));
  let o = k;
  let y = (1 - k) * dy;
  if (tOut !== null) {
    const ko = easeInOut(prog(t, tOut, tOut + 0.3));
    o *= 1 - ko;
    if (ko > 0) y = -40 * ko;
  }
  return { opacity: o, transform: `translateY(${y}px)` };
};

export const hourLabel = (v: number) => {
  let h = Math.floor(v);
  let m = Math.round(((v - h) * 60) / 15) * 15;
  if (m === 60) { h++; m = 0; }
  return `${h}h${String(m).padStart(2, "0")}`;
};

export const formatFr = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
