"use client";

import { useEffect, useRef } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface Props {
  speed: number; // km/h
  maxSpeed?: number;
}

export function Speedometer({ speed, maxSpeed = 200 }: Props) {
  const springSpeed = useSpring(speed, { stiffness: 120, damping: 20 });

  useEffect(() => {
    springSpeed.set(speed);
  }, [speed, springSpeed]);

  const clampedSpeed = Math.min(Math.max(speed, 0), maxSpeed);
  const speedForDisplay = Math.round(clampedSpeed);

  // Arc parameters
  const size = 220;
  const cx = size / 2;
  const cy = size / 2 + 10;
  const r = 90;
  const startAngle = -220;
  const endAngle = 40;
  const totalAngle = endAngle - startAngle;

  function polarToXY(angleDeg: number, radius: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  function describeArc(start: number, end: number, rad: number) {
    const s = polarToXY(start, rad);
    const e = polarToXY(end, rad);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${rad} ${rad} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  }

  const progressAngle = startAngle + (clampedSpeed / maxSpeed) * totalAngle;

  // Speed zone colors
  const getColor = (spd: number) => {
    if (spd < 40) return "#1EE8A0";
    if (spd < 80) return "#00C9FF";
    if (spd < 120) return "#FF6B2B";
    return "#FF3B5C";
  };

  const color = getColor(clampedSpeed);

  // Tick marks
  const ticks = Array.from({ length: 21 }, (_, i) => i * (maxSpeed / 20));

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size * 0.7 }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="absolute top-0 left-0"
          style={{ overflow: "visible" }}
        >
          {/* Background arc */}
          <path
            d={describeArc(startAngle, endAngle, r)}
            fill="none"
            stroke="#2D2D42"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Progress arc */}
          <motion.path
            d={describeArc(startAngle, progressAngle, r)}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${color}88)` }}
          />

          {/* Tick marks */}
          {ticks.map((tickSpeed, i) => {
            const tickAngle = startAngle + (i / 20) * totalAngle;
            const outer = polarToXY(tickAngle, r + 4);
            const inner = polarToXY(tickAngle, r - (i % 5 === 0 ? 10 : 5));
            return (
              <line
                key={i}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke={i % 5 === 0 ? "#6B6B8A" : "#2D2D42"}
                strokeWidth={i % 5 === 0 ? 1.5 : 1}
              />
            );
          })}

          {/* Speed labels at 0, 40, 80, 120, 160, 200 */}
          {[0, 40, 80, 120, 160, 200].map((spd) => {
            const angle = startAngle + (spd / maxSpeed) * totalAngle;
            const pos = polarToXY(angle, r - 22);
            return (
              <text
                key={spd}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                fill="#6B6B8A"
                fontFamily="monospace"
              >
                {spd}
              </text>
            );
          })}

          {/* Needle */}
          {(() => {
            const needleEnd = polarToXY(progressAngle, r - 15);
            const needleBase1 = polarToXY(progressAngle - 90, 8);
            const needleBase2 = polarToXY(progressAngle + 90, 8);
            return (
              <g>
                <motion.polygon
                  points={`${cx},${cy} ${needleBase1.x},${needleBase1.y} ${needleEnd.x},${needleEnd.y} ${needleBase2.x},${needleBase2.y}`}
                  fill={color}
                  style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
                />
                <circle cx={cx} cy={cy} r={6} fill="#1C1C28" stroke={color} strokeWidth={2} />
              </g>
            );
          })()}
        </svg>

        {/* Center speed display */}
        <div
          className="absolute flex flex-col items-center"
          style={{ bottom: 0, left: "50%", transform: "translateX(-50%)" }}
        >
          <motion.span
            key={speedForDisplay}
            className="text-5xl font-black font-numeric leading-none"
            style={{ color }}
          >
            {speedForDisplay}
          </motion.span>
          <span className="text-xs text-muted-foreground font-medium mt-1">km/h</span>
        </div>
      </div>
    </div>
  );
}
