"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";

// ---------- Tweakable configuration (change these values to tweak the splash) ----------
const CONFIG = {
  // logo
  logoSrc: "/SQLockLogo1.png",
  logoWidthVW: 72, // vw
  logoMaxPx: 768,
  logoHeightVH: 56, // vh
  logoMaxHeightPx: 720,

  // pulse / breathing
  pulse: {
    minScale: 0.5,
    maxScale: 0.8,
    durationSec: 5.0,
    easing: "cubic-bezier(0.2,0.2,0.2,1)",
  },

  // fade/hide
  fadeMs: 1400,
  fadeEasing: "cubic-bezier(0.4,0,0.2,1)",
  hideBrightness: 0.78,
  hideBlurPx: 6,

  // ambient glow
  glow: {
    opacity: 0.72,
    midOpacity: 0.14,
    blurPx: 56,
    sizeVW: 56,
    maxPx: 820,
  },
};

export default function SplashIntro() {
  const [visible, setVisible] = useState(true);
  const [removed, setRemoved] = useState(false);
  const [pulseOn, setPulseOn] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  // Wait for theme to be mounted
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Use theme-aware colors
  const isDark = mounted && resolvedTheme === "dark";
  const glowColor = isDark ? "rgba(0, 212, 255," : "rgba(96, 163, 255,"; // cyan for dark, blue for light
  const glowFull = `${glowColor}${CONFIG.glow.opacity})`;
  const glowMid = `${glowColor}${CONFIG.glow.midOpacity})`;
  const dropShadowVisible = `${glowColor}0.12)`;
  const dropShadowHidden = `${glowColor}0.06)`;

  const containerState = visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none";
  const pulseAnimation = pulseOn ? `pulseSlow ${CONFIG.pulse.durationSec}s ${CONFIG.pulse.easing} infinite` : "none";
  
  const filterStyle = visible
    ? `brightness(1) blur(0px) drop-shadow(0 28px 80px ${dropShadowVisible})`
    : `brightness(${CONFIG.hideBrightness}) blur(${CONFIG.hideBlurPx}px) drop-shadow(0 12px 40px ${dropShadowHidden})`;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-hidden={false}
      onClick={dismiss}
      onKeyDown={onKeyDown}
      onTransitionEnd={onTransitionEnd}
      className={`fixed inset-0 z-[9999] flex items-center justify-center ${containerState} transition-opacity`}
      style={{
        transitionDuration: `${CONFIG.fadeMs}ms`,
        transitionTimingFunction: CONFIG.fadeEasing,
        transitionProperty: "opacity",
        backdropFilter: visible ? "blur(20px)" : "blur(0px)",
        backgroundColor: visible ? "rgba(0, 0, 0, 0.5)" : "transparent",
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
            background: `radial-gradient(circle, ${glowFull} 0%, ${glowMid} 40%, transparent 60%)`,
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
        className="relative flex items-center justify-center"
        style={{
          width: `${CONFIG.logoWidthVW}vw`,
          maxWidth: `${CONFIG.logoMaxPx}px`,
          height: `${CONFIG.logoHeightVH}vh`,
          maxHeight: `${CONFIG.logoMaxHeightPx}px`,
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
              <Image
                src={CONFIG.logoSrc}
                alt="SQLock"
                fill
                sizes={`(max-width: 768px) ${CONFIG.logoWidthVW}vw, ${CONFIG.logoMaxPx}px`}
                priority
                style={{ objectFit: "contain" }}
              />
            </div>
          </div>
      </div>

      {/* hint text */}
      <div className="absolute bottom-12 text-center w-full text-sm text-muted-foreground select-none pointer-events-none">
        <div
          className={visible ? "opacity-100 transition-opacity duration-500" : "opacity-0 transition-opacity duration-500"}
        >
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
