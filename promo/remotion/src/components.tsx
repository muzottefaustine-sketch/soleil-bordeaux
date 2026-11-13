import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, WORDMARK_FONT, clamp } from "./theme";

/** Absolute time in seconds inside a <Sequence from={start*fps}>. */
export const useT = (start: number) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return start + f / fps;
};

/** The app's splash-screen sun (same SVG as index.html). */
export const Sun: React.FC<{ size: number; style?: React.CSSProperties }> = ({ size, style }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} style={style}>
    <g fill={C.sun}>
      {[[0, 3.2, 7], [40, 2.8, 6.5], [75, 3.4, 7.5], [110, 3, 6.8], [145, 2.8, 6.2], [180, 3.3, 7.2], [215, 2.9, 6.5], [250, 3.5, 7], [285, 2.8, 6.3], [320, 3.1, 7.2]].map(
        ([r, rx, ry]) => <ellipse key={r} cx="50" cy="11" rx={rx} ry={ry} transform={`rotate(${r} 50 50)`} />
      )}
    </g>
    <circle cx="50" cy="50" r="21" fill={C.sun} />
    <circle cx="48" cy="48" r="17" fill="#FFE000" opacity="0.55" />
    <circle cx="52" cy="52" r="14" fill="#FFC400" opacity="0.25" />
  </svg>
);

export const Wordmark: React.FC<{ size: number; style?: React.CSSProperties }> = ({ size, style }) => (
  <div style={{ fontFamily: WORDMARK_FONT, fontWeight: 700, fontSize: size, letterSpacing: "-0.02em", color: C.ink, ...style }}>
    <em>Soleil</em>enterrasse
  </div>
);

export const Eyebrow: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; color?: string }> = ({ children, style, color = C.ink3 }) => (
  <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 30, letterSpacing: "0.16em", textTransform: "uppercase", color, ...style }}>
    <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: "50%", background: C.sun, marginRight: 16, verticalAlign: 2 }} />
    {children}
  </div>
);

export const Dot = () => <span style={{ color: C.accent }}>.</span>;

/** Bold headline in the house style. */
export const H: React.FC<{ size?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ size = 96, children, style }) => (
  <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: size, letterSpacing: "-0.045em", lineHeight: 1.04, color: C.ink, ...style }}>{children}</div>
);
export const Muted: React.FC<{ children: React.ReactNode }> = ({ children }) => <span style={{ color: C.ink3 }}>{children}</span>;

/** Phone frame whose inner screen matches the 393×852 captures. */
export const Phone: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div style={{ position: "absolute", width: 620, height: 1311, left: 230, top: 560, borderRadius: 96, background: "#111214", padding: 14,
    boxShadow: "0 50px 100px rgba(15,23,42,0.16), 0 10px 30px rgba(15,23,42,0.10)", ...style }}>
    <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 82, overflow: "hidden", background: C.white }}>{children}</div>
  </div>
);

const cover: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" };

/** Cross-fades through a list of frames; k in [0,1]. Only the two visible frames are mounted. */
export const ImageSequence: React.FC<{ files: string[]; k: number; style?: React.CSSProperties }> = ({ files, k, style }) => {
  const f = clamp(k) * (files.length - 1);
  const i = Math.min(files.length - 2, Math.floor(f));
  const r = f - i;
  return (
    <AbsoluteFill style={style}>
      <Img src={staticFile(files[i])} style={cover} />
      <Img src={staticFile(files[i + 1])} style={{ ...cover, opacity: r }} />
    </AbsoluteFill>
  );
};

export const Cover: React.FC<{ file: string; style?: React.CSSProperties }> = ({ file, style }) => (
  <Img src={staticFile(file)} style={{ ...cover, ...style }} />
);

/** White gradient at the bottom of full-bleed 3D shots, so text stays readable. */
export const BottomFade: React.FC<{ height?: number }> = ({ height = 1000 }) => (
  <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height,
    background: "linear-gradient(to top, #fff 0%, #fff 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0) 100%)" }} />
);
