export function Backdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* === LIGHT MODE: soft Duolingo-friendly backdrop === */}
      <div className="absolute inset-0 bg-[#F7F7F7] dark:hidden" />

      {/* Soft pastel blobs */}
      <div
        className="absolute -top-32 -left-24 h-[55vh] w-[55vh] rounded-full opacity-40 blur-[110px] dark:hidden"
        style={{
          background:
            "radial-gradient(circle, rgba(88,204,2,0.45) 0%, rgba(88,204,2,0) 70%)",
          animation: "drift 24s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-1/3 -right-32 h-[50vh] w-[50vh] rounded-full opacity-35 blur-[110px] dark:hidden"
        style={{
          background:
            "radial-gradient(circle, rgba(28,176,246,0.45) 0%, rgba(28,176,246,0) 70%)",
          animation: "drift 30s ease-in-out infinite reverse",
        }}
      />
      <div
        className="absolute bottom-0 left-1/4 h-[45vh] w-[45vh] rounded-full opacity-30 blur-[110px] dark:hidden"
        style={{
          background:
            "radial-gradient(circle, rgba(255,200,0,0.5) 0%, rgba(255,200,0,0) 70%)",
          animation: "drift 28s ease-in-out infinite",
        }}
      />

      {/* === DARK MODE: original neon === */}
      <div className="absolute inset-0 hidden bg-[radial-gradient(ellipse_at_top,_#1a0b3a_0%,_#05030a_55%,_#020106_100%)] dark:block" />

      <div
        className="absolute -top-32 -left-24 hidden h-[60vh] w-[60vh] rounded-full opacity-60 blur-[120px] dark:block"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.7) 0%, rgba(139,92,246,0) 70%)",
          animation: "drift 18s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-1/3 -right-32 hidden h-[55vh] w-[55vh] rounded-full opacity-50 blur-[120px] dark:block"
        style={{
          background:
            "radial-gradient(circle, rgba(236,72,153,0.6) 0%, rgba(236,72,153,0) 70%)",
          animation: "drift 22s ease-in-out infinite reverse",
        }}
      />
      <div
        className="absolute bottom-0 left-1/4 hidden h-[50vh] w-[50vh] rounded-full opacity-40 blur-[120px] dark:block"
        style={{
          background:
            "radial-gradient(circle, rgba(34,211,238,0.5) 0%, rgba(34,211,238,0) 70%)",
          animation: "drift 26s ease-in-out infinite",
        }}
      />

      {/* Grid — dark only */}
      <div className="absolute inset-0 hidden grid-bg opacity-70 dark:block" />

      {/* Noise — dark only via .noise rule */}
      <div className="absolute inset-0 noise" />

      {/* Vignette — dark only */}
      <div className="absolute inset-0 hidden bg-[radial-gradient(ellipse_at_center,_transparent_55%,_#05030a_100%)] dark:block" />
    </div>
  );
}
