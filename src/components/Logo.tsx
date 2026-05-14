type Props = { className?: string };

export function Logo({ className }: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="50%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <radialGradient id="logo-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#7c3aed" />
        </radialGradient>
      </defs>

      {/* Orbit ring — tilted right */}
      <ellipse
        cx="32"
        cy="32"
        rx="27"
        ry="11"
        transform="rotate(-28 32 32)"
        stroke="url(#logo-grad)"
        strokeWidth="2"
      />

      {/* Orbit ring — tilted left (lower opacity for depth) */}
      <ellipse
        cx="32"
        cy="32"
        rx="27"
        ry="11"
        transform="rotate(28 32 32)"
        stroke="url(#logo-grad)"
        strokeWidth="2"
        opacity="0.55"
      />

      {/* X marker */}
      <path
        d="M14 14 L50 50 M50 14 L14 50"
        stroke="url(#logo-grad)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Glowing core */}
      <circle cx="32" cy="32" r="4.5" fill="url(#logo-core)" />
    </svg>
  );
}
