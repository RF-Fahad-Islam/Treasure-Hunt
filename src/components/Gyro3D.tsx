type Props = {
  size?: number;
  className?: string;
};

export function Gyro3D({ size = 280, className }: Props) {
  return (
    <div
      aria-hidden
      className={["scene-3d relative", className].filter(Boolean).join(" ")}
      style={{ width: size, height: size }}
    >
      <div
        className="preserve-3d absolute inset-0"
        style={{ animation: "float-slow 6s ease-in-out infinite" }}
      >
        {/* Outer halo */}
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-50"
          style={{
            background:
              "radial-gradient(circle, rgba(139,92,246,0.45) 0%, rgba(34,211,238,0.25) 45%, transparent 70%)",
          }}
        />

        {/* Ring — violet (equatorial, spin around Z) */}
        <div
          className="preserve-3d absolute inset-0 rounded-full border-2"
          style={{
            borderColor: "rgba(167,139,250,0.55)",
            boxShadow:
              "0 0 24px rgba(139,92,246,0.45), inset 0 0 24px rgba(139,92,246,0.25)",
            animation: "gyro-spin-y 14s linear infinite",
          }}
        />

        {/* Ring — magenta (vertical, spin around Z opposite) */}
        <div
          className="preserve-3d absolute inset-0 rounded-full border-2"
          style={{
            borderColor: "rgba(236,72,153,0.5)",
            boxShadow:
              "0 0 24px rgba(236,72,153,0.4), inset 0 0 24px rgba(236,72,153,0.2)",
            animation: "gyro-spin-x 18s linear infinite",
          }}
        />

        {/* Ring — cyan (diagonal) */}
        <div
          className="preserve-3d absolute inset-0 rounded-full border-2"
          style={{
            borderColor: "rgba(103,232,249,0.5)",
            boxShadow:
              "0 0 24px rgba(34,211,238,0.4), inset 0 0 24px rgba(34,211,238,0.2)",
            animation: "gyro-spin-z 22s linear infinite reverse",
          }}
        />

        {/* Inner ring — thin */}
        <div
          className="absolute rounded-full border"
          style={{
            inset: "22%",
            borderColor: "rgba(255,255,255,0.18)",
            animation: "gyro-spin-y 8s linear infinite reverse",
          }}
        />

        {/* Glowing core */}
        <div
          className="absolute rounded-full"
          style={{
            inset: "42%",
            background:
              "radial-gradient(circle, #fff 0%, #ec4899 35%, #7c3aed 70%, transparent 100%)",
            boxShadow:
              "0 0 30px rgba(236,72,153,0.7), 0 0 60px rgba(139,92,246,0.5)",
            animation: "core-pulse 2.6s ease-in-out infinite",
          }}
        />

        {/* X marker overlay */}
        <svg
          className="absolute inset-0 m-auto"
          width="60%"
          height="60%"
          viewBox="0 0 100 100"
          fill="none"
          style={{ opacity: 0.55 }}
        >
          <path
            d="M20 20 L80 80 M80 20 L20 80"
            stroke="url(#xg)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="xg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
