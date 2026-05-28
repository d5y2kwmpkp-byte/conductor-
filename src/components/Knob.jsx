import { useRef, useCallback } from "react";

export default function Knob({ value, min = 0, max = 1, onChange, size = 44, color = "#333", centerZero = false }) {
  const dragging = useRef(false);
  const startY   = useRef(0);
  const startVal = useRef(0);

  const norm  = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const angle = -135 + norm * 270;
  const rad   = angle * Math.PI / 180;
  const r     = size / 2 - 7;
  const dotX  = size / 2 + Math.cos(rad) * (r - 1);
  const dotY  = size / 2 + Math.sin(rad) * (r - 1);

  const arcD = (pct, radius) => {
    const sa = -135 * Math.PI / 180;
    const ea = sa + pct * 270 * Math.PI / 180;
    const x1 = size/2 + Math.cos(sa) * radius, y1 = size/2 + Math.sin(sa) * radius;
    const x2 = size/2 + Math.cos(ea) * radius, y2 = size/2 + Math.sin(ea) * radius;
    return `M${x1} ${y1} A${radius} ${radius} 0 ${pct * 270 > 180 ? 1 : 0} 1 ${x2} ${y2}`;
  };

  const onDown = useCallback(e => {
    e.preventDefault();
    dragging.current = true;
    startY.current   = e.touches ? e.touches[0].clientY : e.clientY;
    startVal.current = value;
    const move = ev => {
      if (!dragging.current) return;
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
      onChange(Math.min(max, Math.max(min, startVal.current + (startY.current - cy) / 100 * (max - min))));
    };
    const up = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up);
  }, [value, min, max, onChange]);

  return (
    <svg
      width={size} height={size}
      onMouseDown={onDown} onTouchStart={onDown}
      style={{ cursor: "ns-resize", touchAction: "none", display: "block", userSelect: "none" }}
    >
      <defs>
        <radialGradient id="kg" cx="38%" cy="32%">
          <stop offset="0%"   stopColor="#f0ece4" />
          <stop offset="100%" stopColor="#b8b4ac" />
        </radialGradient>
      </defs>
      <path d={arcD(1, r)} fill="none" stroke="#aaa" strokeWidth="2.5" strokeLinecap="round" />
      {norm > 0.01 && <path d={arcD(norm, r)} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />}
      <circle cx={size/2} cy={size/2} r={r - 1} fill="url(#kg)" stroke="#a0a09a" strokeWidth="1" />
      <circle cx={dotX} cy={dotY} r="2.5" fill={color} opacity="0.95" />
    </svg>
  );
}
