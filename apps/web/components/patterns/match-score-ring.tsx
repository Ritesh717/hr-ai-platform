"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";

const RADIUS = 20;
const STROKE = 4;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SIZE = (RADIUS + STROKE) * 2;

function scoreColor(score: number) {
  if (score >= 80) return "hsl(142 71% 45%)";   // success/green
  if (score >= 60) return "hsl(38 92% 50%)";    // warning/amber
  return "hsl(215 14% 55%)";                    // neutral/gray
}

interface Props {
  score: number;
  size?: "sm" | "lg";
  className?: string;
}

export function MatchScoreRing({ score, size = "sm", className }: Props) {
  const circleRef = useRef<SVGCircleElement>(null);
  const isLg = size === "lg";
  const radius = isLg ? 36 : RADIUS;
  const stroke = isLg ? 5 : STROKE;
  const circ = 2 * Math.PI * radius;
  const svgSize = (radius + stroke) * 2;
  const target = circ * (1 - score / 100);

  useEffect(() => {
    const el = circleRef.current;
    if (!el) return;
    el.style.strokeDashoffset = String(circ);
    const raf = requestAnimationFrame(() => {
      el.style.transition = "stroke-dashoffset 600ms ease-out";
      el.style.strokeDashoffset = String(target);
    });
    return () => cancelAnimationFrame(raf);
  }, [circ, target]);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center shrink-0", className)}
      style={{ width: svgSize, height: svgSize }}
    >
      <svg width={svgSize} height={svgSize} style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-border"
        />
        {/* Arc */}
        <circle
          ref={circleRef}
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          stroke={scoreColor(score)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ}
        />
      </svg>
      <span
        className={cn(
          "absolute font-bold tabular-nums",
          isLg ? "text-lg" : "text-[11px]",
        )}
        style={{ color: scoreColor(score) }}
      >
        {score}
      </span>
    </div>
  );
}
