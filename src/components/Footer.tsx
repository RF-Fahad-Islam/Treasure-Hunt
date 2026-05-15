import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Logo } from "./Logo";
import { Reveal } from "./Reveal";

const credits = [
  { name: "MD Fahad Islam", role: "Lead Developer", color: "var(--color-brand-green)", fb: "https://www.facebook.com/fahadislam97", img: "https://scontent.fdac174-1.fna.fbcdn.net/v/t39.30808-6/528036926_1290660856013436_4638983471179816113_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeEyWt1pTFTPNVd6gC0pEHOcg0gG5OKrOaaDSAbk4qs5pjLniYpeX_dD3NmLNVFDeqOHHDBTGz7kXjJ9oM98y62O&_nc_ohc=mXIdrg1lUkUQ7kNvwGedfvU&_nc_oc=Adql3Xp40CV3u4fx3mXrYid9YYF5VebLJ5IA2lirNtgkN_AU3YQJYDlq-RU2hUt2jhc&_nc_zt=23&_nc_ht=scontent.fdac174-1.fna&_nc_gid=sFrY-f8sR0KIfj5UUBi3zA&_nc_ss=7b2a8&oh=00_Af5PjZsf_DKnwSY6Jzd6JzN3gdjI4KpU2Vry1sw1NISgPw&oe=6A0CBAF7" },
  { name: "Labib Karim", role: "UI/UX Designer", color: "var(--color-brand-blue)", fb: "https://www.facebook.com/labib.karim.73", img: "https://scontent.fdac174-1.fna.fbcdn.net/v/t39.30808-6/501309229_1319678796421330_733066334766105632_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeE-SC7JDdxvD5wMWLXEWvf5o4XUGSHJr6-jhdQZIcmvr8wJWmieLIyfm6ekDUo6Tk3oefu9wbOUAfxfiHMM2ieu&_nc_ohc=M5e0t-wM9egQ7kNvwEI9nKl&_nc_oc=AdraUQLAUuXFVrMad-cQUChgQjL9twqf2QD7x7uOmAPD9M1Ne69c0rpf6LnhPX5qlcg&_nc_zt=23&_nc_ht=scontent.fdac174-1.fna&_nc_gid=YkudNtULZ0_0JeFxNsuNyw&_nc_ss=7b2a8&oh=00_Af6tCaRzc6sDlxlPzFSn1ltJ5LLKj56L0HQ5dgQut7kQXQ&oe=6A0C8E49" },
];

export function Footer() {
  const [showCredits, setShowCredits] = useState(false);

  return (
    <footer className="relative z-10 mt-16 px-5 pb-10 pt-12 sm:px-8">
      <motion.div
        aria-hidden
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mb-10 h-px max-w-6xl origin-center bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/15"
      />
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
        <Reveal direction="left" className="flex items-center gap-3">
          <Logo className="h-10 w-10" />
          <div className="flex flex-col leading-tight">
            <span className="font-display text-base font-extrabold tracking-tight text-[#2B2B2B] dark:text-white">
              Treasure Hunt
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#777] dark:text-white/45">
              University of Dhaka · CSE
            </span>
          </div>
        </Reveal>

        <Reveal
          direction="right"
          delay={0.1}
          className="flex flex-col gap-1 text-sm font-semibold text-[#777] dark:text-white/55 sm:items-end sm:text-right"
        >
          <span>Built by students, for students.</span>
          <div className="flex items-center gap-3 mt-1 sm:justify-end">
            <span className="text-xs text-[#999] dark:text-white/35">
              © {new Date().getFullYear()} DU CSE · The Hunt
            </span>
            <span className="text-xs text-[#999] dark:text-white/35">·</span>
            <button
              onClick={() => setShowCredits(true)}
              className="text-xs font-bold text-[#58CC02] hover:text-[#46a302] transition-colors"
            >
              View Credits
            </button>
          </div>
        </Reveal>
      </div>

      <AnimatePresence>
        {showCredits && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 text-left">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCredits(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-[#1A1A1A] border-4 border-[var(--border-soft)] rounded-[32px] p-8 w-full max-w-md shadow-2xl overflow-hidden"
              style={{ borderBottomWidth: "10px" }}
            >
              <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
              <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-[var(--color-brand-green)]/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-[var(--color-brand-blue)]/10 blur-3xl pointer-events-none" />

              <button
                onClick={() => setShowCredits(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </button>

              <div className="relative z-10 text-center">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <motion.div
                    animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.08, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-3xl bg-[var(--color-brand-green)]/20 blur-xl"
                  />
                  <div className="relative w-20 h-20 bg-[var(--surface)] border-4 border-[var(--border-soft)] rounded-3xl flex items-center justify-center shadow-xl overflow-hidden" style={{ borderBottomWidth: "8px" }}>
                    <Logo className="w-12 h-12" />
                  </div>
                </div>

                <h3 className="font-display text-2xl font-black text-white mb-2">Development Credits</h3>
                <p className="text-[#888] font-bold italic mb-1">Brought to you by</p>
                <p className="text-[#666] text-[10px] font-extrabold uppercase tracking-[0.2em] mb-7">
                  CSEDU-31
                </p>

                <div className="flex items-center gap-3 mb-8">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  <div className="w-2 h-2 rounded-full bg-[var(--color-brand-green)]" />
                  <div className="w-2 h-2 rounded-full bg-[var(--color-brand-blue)]" />
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>

                <div className="space-y-3 mb-10">
                  {credits.map((person, i) => (
                    <motion.a
                      key={person.name}
                      href={person.fb}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, x: -24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.15, type: "spring", damping: 20, stiffness: 250 }}
                      className="group relative block bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 hover:bg-white/[0.06] transition-all duration-300"
                    >
                      <div
                        className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full opacity-60 group-hover:opacity-100 transition-opacity"
                        style={{ background: `linear-gradient(180deg, ${person.color}, color-mix(in srgb, ${person.color} 70%, transparent))` }}
                      />

                      <div className="flex items-center gap-3.5 pl-3">
                        <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-white/10">
                          <img src={person.img} alt={person.name} className="w-full h-full object-cover" loading="lazy" />
                        </div>

                        <div className="text-left flex-1 min-w-0">
                          <p className="font-black text-[15px] tracking-tight truncate" style={{ color: person.color }}>
                            {person.name}
                          </p>
                          <span
                            className="inline-block text-[9px] font-extrabold uppercase tracking-[0.15em] px-2.5 py-0.5 rounded-full mt-0.5"
                            style={{
                              background: `color-mix(in srgb, ${person.color} 14%, transparent)`,
                              color: person.color,
                            }}
                          >
                            {person.role}
                          </span>
                        </div>

                        <svg
                          width="14" height="14" viewBox="0 0 16 16" fill="none"
                          className="text-white/15 group-hover:text-white/50 transition-all group-hover:translate-x-0.5 shrink-0"
                        >
                          <path d="M3 8h10m0 0L8.5 3.5M13 8l-4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </motion.a>
                  ))}
                </div>

                <button
                  onClick={() => setShowCredits(false)}
                  className="btn-press ripple btn-primary w-full py-4 rounded-2xl text-[16px]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </footer>
  );
}
