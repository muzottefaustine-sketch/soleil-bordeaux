import React from "react";
import { Composition } from "remotion";
import { Promo, FPS, DURATION_S } from "./Promo";

export const RemotionRoot: React.FC = () => (
  <Composition id="Promo" component={Promo} fps={FPS} width={1080} height={1920} durationInFrames={Math.round(DURATION_S * FPS)} />
);
