'use client';

interface ToggleProps {
  on: boolean;
  onClick: () => void;
  scale?: number;
}

// Pill on/off switch styled by the global `.toggle` / `.toggle.on` classes.
export default function Toggle({ on, onClick, scale }: ToggleProps) {
  return (
    <button
      type="button"
      className={`toggle${on ? ' on' : ''}`}
      style={scale ? { transform: `scale(${scale})` } : undefined}
      onClick={onClick}
    />
  );
}
