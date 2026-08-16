"use client";

import type { AnatomyRegion } from "@/lib/types/visuals";

interface PoseDiagramProps {
  poseKey: string;
  step?: number;
  highlightRegions?: AnatomyRegion[];
  className?: string;
}

/** Simple instructional stick-figure diagrams — step index morphs limb angles. */
export function PoseDiagram({
  poseKey,
  step = 2,
  highlightRegions = [],
  className = "",
}: PoseDiagramProps) {
  const pose = POSE_RENDERERS[poseKey] ?? POSE_RENDERERS.default;
  const limbs = pose(step);

  return (
    <svg
      viewBox="0 0 200 320"
      className={`h-full w-full ${className}`}
      role="img"
      aria-label={`${poseKey} pose diagram step ${step + 1}`}
    >
      <defs>
        <linearGradient id="matGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ecfdf5" />
          <stop offset="100%" stopColor="#d1fae5" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="200" height="320" fill="url(#matGrad)" rx="16" />
      <line x1="20" y1="300" x2="180" y2="300" stroke="#94a3b8" strokeWidth="2" />
      <text x="100" y="24" textAnchor="middle" fontSize="11" fill="#0f766e" fontWeight="600">
        Instructional diagram
      </text>

      {/* Body */}
      <circle cx={limbs.head.x} cy={limbs.head.y} r="14" fill="#fde68a" stroke="#92400e" strokeWidth="2" />
      <line
        x1={limbs.head.x}
        y1={limbs.head.y + 14}
        x2={limbs.hip.x}
        y2={limbs.hip.y}
        stroke="#334155"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Arms */}
      <line
        x1={limbs.shoulder.x}
        y1={limbs.shoulder.y}
        x2={limbs.leftHand.x}
        y2={limbs.leftHand.y}
        stroke="#334155"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1={limbs.shoulder.x}
        y1={limbs.shoulder.y}
        x2={limbs.rightHand.x}
        y2={limbs.rightHand.y}
        stroke="#334155"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Legs */}
      <line
        x1={limbs.hip.x}
        y1={limbs.hip.y}
        x2={limbs.leftFoot.x}
        y2={limbs.leftFoot.y}
        stroke="#334155"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <line
        x1={limbs.hip.x}
        y1={limbs.hip.y}
        x2={limbs.rightFoot.x}
        y2={limbs.rightFoot.y}
        stroke="#334155"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {highlightRegions.map((region) => (
        <g key={region.id}>
          <circle
            cx={(region.x / 100) * 200}
            cy={(region.y / 100) * 320}
            r="12"
            fill="rgba(239, 68, 68, 0.35)"
            stroke="#dc2626"
            strokeWidth="2"
          />
          <text
            x={(region.x / 100) * 200}
            y={(region.y / 100) * 320 + 28}
            textAnchor="middle"
            fontSize="9"
            fill="#991b1b"
          >
            {region.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

interface Point {
  x: number;
  y: number;
}

interface LimbSet {
  head: Point;
  shoulder: Point;
  hip: Point;
  leftHand: Point;
  rightHand: Point;
  leftFoot: Point;
  rightFoot: Point;
}

type PoseRenderer = (step: number) => LimbSet;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function blend(a: LimbSet, b: LimbSet, t: number): LimbSet {
  const keys = Object.keys(a) as (keyof LimbSet)[];
  const out = {} as LimbSet;
  for (const key of keys) {
    out[key] = {
      x: lerp(a[key].x, b[key].x, t),
      y: lerp(a[key].y, b[key].y, t),
    };
  }
  return out;
}

function seated(step: number, crossed = false): LimbSet {
  const stages: LimbSet[] = [
    {
      head: { x: 100, y: 70 },
      shoulder: { x: 100, y: 95 },
      hip: { x: 100, y: 150 },
      leftHand: { x: 70, y: 170 },
      rightHand: { x: 130, y: 170 },
      leftFoot: { x: 80, y: 240 },
      rightFoot: { x: 120, y: 240 },
    },
    {
      head: { x: 100, y: 68 },
      shoulder: { x: 100, y: 92 },
      hip: { x: 100, y: 155 },
      leftHand: { x: 65, y: 185 },
      rightHand: { x: 135, y: 185 },
      leftFoot: { x: crossed ? 115 : 85, y: 235 },
      rightFoot: { x: crossed ? 85 : 115, y: 235 },
    },
    {
      head: { x: 100, y: 65 },
      shoulder: { x: 100, y: 90 },
      hip: { x: 100, y: 160 },
      leftHand: { x: 60, y: 195 },
      rightHand: { x: 140, y: 195 },
      leftFoot: { x: crossed ? 118 : 82, y: 230 },
      rightFoot: { x: crossed ? 82 : 118, y: 230 },
    },
    {
      head: { x: 100, y: 63 },
      shoulder: { x: 100, y: 88 },
      hip: { x: 100, y: 162 },
      leftHand: { x: 58, y: 200 },
      rightHand: { x: 142, y: 200 },
      leftFoot: { x: crossed ? 120 : 80, y: 228 },
      rightFoot: { x: crossed ? 80 : 120, y: 228 },
    },
  ];
  const idx = Math.min(step, stages.length - 1);
  if (step >= stages.length - 1) return stages[stages.length - 1];
  const t = step - Math.floor(step);
  return blend(stages[idx], stages[idx + 1] ?? stages[idx], t || 1);
}

const POSE_RENDERERS: Record<string, PoseRenderer> = {
  default: (step) => seated(step),
  siddhasana: (step) => seated(step, true),
  vajrasana: (step) => {
    const stages: LimbSet[] = [
      {
        head: { x: 100, y: 75 },
        shoulder: { x: 100, y: 100 },
        hip: { x: 100, y: 145 },
        leftHand: { x: 75, y: 165 },
        rightHand: { x: 125, y: 165 },
        leftFoot: { x: 85, y: 210 },
        rightFoot: { x: 115, y: 210 },
      },
      {
        head: { x: 100, y: 70 },
        shoulder: { x: 100, y: 95 },
        hip: { x: 100, y: 165 },
        leftHand: { x: 70, y: 180 },
        rightHand: { x: 130, y: 180 },
        leftFoot: { x: 80, y: 235 },
        rightFoot: { x: 120, y: 235 },
      },
      {
        head: { x: 100, y: 65 },
        shoulder: { x: 100, y: 90 },
        hip: { x: 100, y: 175 },
        leftHand: { x: 65, y: 190 },
        rightHand: { x: 135, y: 190 },
        leftFoot: { x: 78, y: 250 },
        rightFoot: { x: 122, y: 250 },
      },
      {
        head: { x: 100, y: 63 },
        shoulder: { x: 100, y: 88 },
        hip: { x: 100, y: 178 },
        leftHand: { x: 62, y: 195 },
        rightHand: { x: 138, y: 195 },
        leftFoot: { x: 76, y: 255 },
        rightFoot: { x: 124, y: 255 },
      },
    ];
    return stages[Math.min(step, stages.length - 1)];
  },
  matsyendrasana: (step) => {
    const base = seated(step);
    const twist = step * 8;
    return {
      ...base,
      head: { x: 100 + twist * 0.3, y: base.head.y },
      leftHand: { x: 130 + twist, y: 120 },
      rightHand: { x: 70, y: 200 },
    };
  },
  paschimottanasana: (step) => {
    const fold = step * 18;
    return {
      head: { x: 100, y: 120 + fold },
      shoulder: { x: 100, y: 145 + fold * 0.5 },
      hip: { x: 100, y: 170 },
      leftHand: { x: 85, y: 220 + fold * 0.3 },
      rightHand: { x: 115, y: 220 + fold * 0.3 },
      leftFoot: { x: 90, y: 260 },
      rightFoot: { x: 110, y: 260 },
    };
  },
  utkatasana: (step) => {
    const squat = step * 12;
    return {
      head: { x: 100, y: 55 - squat * 0.2 },
      shoulder: { x: 100, y: 80 - squat * 0.2 },
      hip: { x: 100, y: 130 + squat },
      leftHand: { x: 55, y: 60 },
      rightHand: { x: 145, y: 60 },
      leftFoot: { x: 75, y: 250 },
      rightFoot: { x: 125, y: 250 },
    };
  },
  vrikshasana: (step) => {
    const lift = step * 15;
    return {
      head: { x: 100, y: 55 },
      shoulder: { x: 100, y: 80 },
      hip: { x: 100, y: 130 },
      leftHand: { x: 70, y: 95 },
      rightHand: { x: 130, y: 95 },
      leftFoot: { x: 100, y: 260 },
      rightFoot: { x: 130, y: 260 - lift },
    };
  },
  trikonasana: (step) => {
    const reach = step * 20;
    return {
      head: { x: 120, y: 70 },
      shoulder: { x: 110, y: 95 },
      hip: { x: 95, y: 140 },
      leftHand: { x: 60, y: 200 + reach * 0.2 },
      rightHand: { x: 150, y: 80 },
      leftFoot: { x: 70, y: 260 },
      rightFoot: { x: 130, y: 260 },
    };
  },
  "adho-mukha-svanasana": (step) => {
    const pike = step * 10;
    return {
      head: { x: 100, y: 140 + pike },
      shoulder: { x: 100, y: 120 + pike },
      hip: { x: 100, y: 90 + pike },
      leftHand: { x: 70, y: 170 },
      rightHand: { x: 130, y: 170 },
      leftFoot: { x: 85, y: 250 },
      rightFoot: { x: 115, y: 250 },
    };
  },
  shavasana: (step) => ({
    head: { x: 100, y: 70 },
    shoulder: { x: 100, y: 95 },
    hip: { x: 100, y: 140 },
    leftHand: { x: 55, y: 110 },
    rightHand: { x: 145, y: 110 },
    leftFoot: { x: 85, y: 250 },
    rightFoot: { x: 115, y: 250 },
  }),
  sirsasana: (step) => {
    const invert = Math.min(step, 3);
    return {
      head: { x: 100, y: 220 - invert * 5 },
      shoulder: { x: 100, y: 190 - invert * 10 },
      hip: { x: 100, y: 120 - invert * 15 },
      leftHand: { x: 75, y: 240 },
      rightHand: { x: 125, y: 240 },
      leftFoot: { x: 85, y: 60 + invert * 5 },
      rightFoot: { x: 115, y: 60 + invert * 5 },
    };
  },
};
