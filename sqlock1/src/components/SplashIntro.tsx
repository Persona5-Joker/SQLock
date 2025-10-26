"use client";

import React, { useEffect, useState } from "react";
// Use plain <img> for quick debugging. If this shows the logo in the browser
// then the issue is likely related to Next/Image optimization. Revert to
// next/image after debugging if desired.

// ---------- Tweakable configuration (change these values to tweak the splash) ----------
const CONFIG = {
  // overlay
  backgroundColorClass: "bg-[#010b1d]",

  // logo
  logoSrc: "/SQLockLogo1.png",
  logoWidthVW: 72, // vw
  logoMaxPx: 768,
  logoHeightVH: 56, // vh
  logoMaxHeightPx: 720,

  // pulse / breathing
  pulse: {
    // aggressive pulse: shrink down and grow much larger
    minScale: 0.5,
    maxScale: 0.6,
    durationSec: 5.0, // faster, more punchy cycle
    // snappier easing for a more pronounced in/out
    easing: "cubic-bezier(0.2,0.2,0.2,1)",
  },

  // fade/hide
  fadeMs: 1400,
  fadeEasing: "cubic-bezier(0.4,0,0.2,1)",
  endScale: 0.9,
  hideBrightness: 0.78,
  hideBlurPx: 6,
  // hex for background so we can transition to transparent
  backgroundHex: "#010b1d",

  // ambient glow
  glow: {
    color: "rgba(96,163,255,", // base color, append opacity -> soft blue
    // stronger ambient glow to match the aggressive scaling
    opacity: 0.72,
    midOpacity: 0.14,
    blurPx: 56,
    sizeVW: 56,
    maxPx: 820,
  },

  // hint text
  hintDurationMs: 500,
};

export default function SplashIntro() {
  const [visible, setVisible] = useState(true);
  const [removed, setRemoved] = useState(false);
  const [pulseOn, setPulseOn] = useState(true);

  // Respect prefers-reduced-motion: skip animations and remove immediately
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setPulseOn(false);
      setVisible(false);
      requestAnimationFrame(() => setRemoved(true));
    }
  }, []);

  const dismiss = () => {
    // stop pulse immediately
    setPulseOn(false);
    // then trigger fade out
    requestAnimationFrame(() => setVisible(false));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") dismiss();
  };

  const onTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName === "opacity" && !visible) setRemoved(true);
  };

  if (removed) return null;

  const containerBase = `fixed inset-0 z-[9999] flex items-center justify-center ${CONFIG.backgroundColorClass}`;
  // prefer a pure fade to transparent: don't scale the container during hide
  const containerState = visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none";

  const imgWrapperClass = `relative w-[${CONFIG.logoWidthVW}vw] max-w-[${CONFIG.logoMaxPx}px] h-[${CONFIG.logoHeightVH}vh] max-h-[${CONFIG.logoMaxHeightPx}px] flex items-center justify-center`;

  const pulseAnimation = pulseOn ? `pulseSlow ${CONFIG.pulse.durationSec}s ${CONFIG.pulse.easing} infinite` : "none";
  // add a subtle blue drop-shadow to the visible state to enhance the glow behind the logo
  const visibleDrop = `${CONFIG.glow.color}0.12)`; // rgba(96,163,255,0.12)
  const hiddenDrop = `${CONFIG.glow.color}0.06)`; // weaker when hiding
  const filterStyle = visible
    ? `brightness(1) blur(0px) drop-shadow(0 28px 80px ${visibleDrop})`
    : `brightness(${CONFIG.hideBrightness}) blur(${CONFIG.hideBlurPx}px) drop-shadow(0 12px 40px ${hiddenDrop})`;

  // precompute glow colors for ring/border
  const glowFull = `${CONFIG.glow.color}${CONFIG.glow.opacity})`;
  const glowMid = `${CONFIG.glow.color}${CONFIG.glow.midOpacity})`;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-hidden={false}
      onClick={dismiss}
      onKeyDown={onKeyDown}
      onTransitionEnd={onTransitionEnd}
      className={`${containerBase} ${containerState} transition-opacity`}
      style={{
        transitionDuration: `${CONFIG.fadeMs}ms`,
        transitionTimingFunction: CONFIG.fadeEasing,
        transitionProperty: "opacity, background-color",
        backgroundColor: visible ? CONFIG.backgroundHex : "transparent",
      }}
    >
      {/* ambient glow */}
      <div aria-hidden className="absolute inset-0 flex items-center justify-center" style={{ pointerEvents: "none" }}>
        <div
          style={{
            width: `${CONFIG.glow.sizeVW}vw`,
            maxWidth: `${CONFIG.glow.maxPx}px`,
            height: `${CONFIG.glow.sizeVW}vw`,
            maxHeight: `${CONFIG.glow.maxPx}px`,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${CONFIG.glow.color}${CONFIG.glow.opacity} 0%, ${CONFIG.glow.color}${CONFIG.glow.midOpacity} 40%, transparent 60%)`,
            filter: `blur(${CONFIG.glow.blurPx}px)`,
            transform: "translateZ(0)",
            opacity: pulseOn ? 1 : 0,
            transition: "opacity 450ms ease",
            willChange: "opacity, transform",
          }}
        />
      </div>

      {/* logo with pulse */}
      <div
        className={imgWrapperClass}
        style={{
          animation: pulseAnimation,
          transformOrigin: "center",
          filter: filterStyle,
          transition: `filter ${Math.round(CONFIG.fadeMs * 0.85)}ms ${CONFIG.fadeEasing}`,
          willChange: "filter, transform, opacity",
        }}
      >
          <div className="relative w-full h-full">
            {/* ring/border that matches ambient glow — behind the logo to smooth the glow edge */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  // make the ring larger than the image so it frames outside the logo
                  width: "100%",
                  height: "100%",
                  // slightly more rounded corners to follow the image frame
                  borderRadius: 180,
                  // stronger, slightly wider blur to blend with ambient glow
                  boxShadow: `0 0 ${Math.max(12, Math.round(CONFIG.glow.blurPx * 0.9))}px ${glowFull}`,
                  // slightly thicker border so it reads as an external frame
                  border: `3px solid ${glowMid}`,
                  transition: "box-shadow 300ms ease, transform 300ms ease",
                  willChange: "box-shadow, transform",
                  // keep it centered and let it overflow the image bounds
                  transform: "translateZ(0)",
                }}
              />
            </div>

            {/* clipped, rounded image so corners are removed and match the ring/frame */}
            <div style={{ width: "100%", height: "100%", borderRadius: 180, overflow: "hidden", position: "relative" }}>
              <img
                src={CONFIG.logoSrc}
                alt="SQLock"
                style={{ width: "100%", height: "100%", objectFit: "contain" as const, display: "block" }}
              />
            </div>
          </div>
      </div>

      {/* hint text */}
      <div className="absolute bottom-12 text-center w-full text-sm text-slate-300 opacity-80 select-none pointer-events-none">
        <div className={visible ? "opacity-100 transition-opacity duration-500" : "opacity-0 transition-opacity duration-500"}>
          Click or tap to enter
        </div>
      </div>

      {/* keyframes injected inline so no external CSS needed */}
      <style>{`
        @keyframes pulseSlow {
          0% { transform: scale(${CONFIG.pulse.minScale}); }
          50% { transform: scale(${CONFIG.pulse.maxScale}); }
          100% { transform: scale(${CONFIG.pulse.minScale}); }
        }
      `}</style>
    </div>
  );
}
