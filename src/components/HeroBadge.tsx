export function HeroBadge() {
  return (
    <div
      aria-hidden
      className="relative inline-flex h-28 w-28 items-center justify-center sm:h-32 sm:w-32"
      style={{ animation: "bob 3.4s ease-in-out infinite" }}
    >
      {/* Drop shadow */}
      <div
        className="absolute inset-0 rounded-[32px]"
        style={{
          background:
            "linear-gradient(135deg, #58CC02 0%, #4FB300 55%, #1CB0F6 100%)",
          boxShadow:
            "0 8px 0 rgba(0,0,0,0.1), 0 18px 40px -10px rgba(88,204,2,0.45)",
        }}
      />

      {/* Glossy highlight */}
      <div
        className="absolute inset-x-2 top-2 h-1/2 rounded-[24px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 100%)",
        }}
      />

      {/* X mark */}
      <svg
        viewBox="0 0 64 64"
        className="relative h-14 w-14 sm:h-16 sm:w-16"
        fill="none"
      >
        <path
          d="M16 16 L48 48 M48 16 L16 48"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <circle cx="32" cy="32" r="4.5" fill="white" />
      </svg>

      {/* Floating gold star */}
      <div
        className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-2xl"
        style={{
          background: "#FFC800",
          boxShadow: "0 4px 0 #D9A800",
          animation: "wiggle 2.8s ease-in-out infinite",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M12 2l2.4 6.9 7.3.6-5.6 4.8 1.8 7.1L12 17.8 6.1 21.4l1.8-7.1L2.3 9.5l7.3-.6L12 2z" />
        </svg>
      </div>

      {/* Floating blue dot */}
      <div
        className="absolute -bottom-1 -left-2 flex h-7 w-7 items-center justify-center rounded-full"
        style={{
          background: "#1CB0F6",
          boxShadow: "0 3px 0 #1591CB",
          animation: "bob 2.4s ease-in-out infinite",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
          <circle cx="12" cy="12" r="4" />
        </svg>
      </div>
    </div>
  );
}
