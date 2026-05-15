import { motion } from "motion/react";
import { Reveal } from "./Reveal";
import { Zap, Users, Trophy } from "lucide-react";

const features = [
  {
    title: "Live clue feed",
    description: "Receive the next clue the moment the previous one is solved. Stay in the loop, wherever the hunt takes you.",
    icon: Zap,
    color: "#58CC02",
    bg: "rgba(88, 204, 2, 0.12)",
    floatDelay: 0,
    floatDuration: 5,
  },
  {
    title: "Team intel",
    description: "Your roster, your captain, your status. Everything your team needs in one tap.",
    icon: Users,
    color: "#1CB0F6",
    bg: "rgba(28, 176, 246, 0.12)",
    floatDelay: 0.5,
    floatDuration: 6,
  },
  {
    title: "Leaderboard",
    description: "Track the chase in real time. Watch your team climb — or close the gap.",
    icon: Trophy,
    color: "#FFC800",
    bg: "rgba(255, 200, 0, 0.12)",
    floatDelay: 1,
    floatDuration: 5.5,
  }
];

export function Experience() {
  return (
    <section id="how" className="relative py-24 px-5 sm:px-8 overflow-hidden transition-colors duration-300" style={{ background: "transparent" }}>
      {/* Grid Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      
      {/* Background soft glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--color-brand-green)]/5 rounded-full blur-[120px] pointer-events-none opacity-50 dark:opacity-20" />
      
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="mb-16 text-left">
          <Reveal>
            <span className="inline-block px-3 py-1 rounded-full bg-[#58CC02]/10 border border-[#58CC02]/20 text-[11px] font-black uppercase tracking-[0.2em] text-[#3A8400] dark:text-[#58CC02] mb-6">
              Treasure Hunt Companion
            </span>
          </Reveal>
          
          <Reveal delay={0.1}>
            <h2 className="font-display text-[clamp(2.5rem,8vw,4.5rem)] font-black leading-[1.1] tracking-tight text-[#2B2B2B] dark:text-white mb-6">
              Built for the <span className="text-[#1CB0F6]">chase.</span><br />
              <span className="text-[#58CC02]">Not the</span> <span className="text-[#FFC800]">chaos.</span>
            </h2>
          </Reveal>
          
          <Reveal delay={0.2}>
            <p className="text-[18px] md:text-[21px] font-semibold leading-relaxed text-[#777] dark:text-white/65 max-w-2xl">
              Everything you need during the hunt — clues, team status, and the live leaderboard — all in one place.
            </p>
          </Reveal>
        </div>

        {/* Animated Preview - Now the primary visual */}
        <div className="relative mb-28">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 60, rotateX: 10 }}
            whileInView={{ 
              opacity: 1, 
              scale: 1, 
              y: 0, 
              rotateX: 0,
              transition: { duration: 1, ease: [0.22, 1, 0.36, 1] }
            }}
            animate={{ 
              y: [0, -15, 0],
              rotateZ: [0, 0.5, 0, -0.5, 0]
            }}
            transition={{ 
              animate: { duration: 10, repeat: Infinity, ease: "easeInOut" }
            }}
            viewport={{ once: true, margin: "-100px" }}
            className="max-w-4xl mx-auto rounded-[40px] border-[12px] border-white dark:border-[#1A1A1A] bg-white dark:bg-[#0A0A0A] overflow-hidden shadow-[0_60px_120px_-20px_rgba(0,0,0,0.2)] dark:shadow-[0_60px_120px_-20px_rgba(0,0,0,0.6)] relative h-[420px] md:h-[480px]"
          >
             {/* Mock Header */}
             <div className="h-16 bg-[#F7F7F7] dark:bg-[#1A1A1A] border-b border-black/5 dark:border-white/5 flex items-center px-10 justify-between">
              <div className="flex gap-2.5">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56] shadow-sm" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-sm" />
                <div className="w-3 h-3 rounded-full bg-[#27C93F] shadow-sm" />
              </div>
              <div className="text-[11px] font-black text-black/25 dark:text-white/20 uppercase tracking-[0.25em]">Treasure Hunt Companion</div>
              <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5" />
            </div>

            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10 h-full">
              <div className="space-y-8">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: "80%" }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="h-12 bg-[#58CC02]/10 rounded-2xl relative overflow-hidden"
                >
                  <motion.div 
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  />
                </motion.div>
                <div className="space-y-4">
                  <div className="h-4 w-full bg-black/5 dark:bg-white/5 rounded-full" />
                  <div className="h-4 w-5/6 bg-black/5 dark:bg-white/5 rounded-full" />
                  <div className="h-4 w-4/6 bg-black/5 dark:bg-white/5 rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="h-24 w-full bg-[#58CC02]/5 border border-[#58CC02]/10 rounded-3xl" />
                  <div className="h-24 w-full bg-[#1CB0F6]/5 border border-[#1CB0F6]/10 rounded-3xl" />
                </div>
              </div>
              <div className="relative h-full flex items-center justify-center">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                  className="w-full aspect-square bg-[#F7F7F7] dark:bg-white/[0.02] rounded-[40px] overflow-hidden relative border-2 border-black/5 dark:border-white/5 shadow-inner"
                >
                    {/* Animated grid lines */}
                    <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.1]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                    
                    {/* Floating map pins */}
                    {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-6 h-6 rounded-full bg-[#58CC02] border-4 border-white shadow-xl z-10 flex items-center justify-center text-[10px] text-white font-black"
                      animate={{ 
                        scale: [1, 1.15, 1], 
                        y: [0, -12, 0],
                        boxShadow: ["0 10px 15px -3px rgba(88,204,2,0.3)", "0 20px 25px -5px rgba(88,204,2,0.4)", "0 10px 15px -3px rgba(88,204,2,0.3)"]
                      }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 3 + i, 
                        delay: i * 0.8,
                        ease: "easeInOut"
                      }}
                      style={{ 
                        left: `${20 + i * 20}%`, 
                        top: `${25 + i * 18}%` 
                      }}
                    >
                      {i + 1}
                    </motion.div>
                  ))}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] dark:opacity-[0.07] font-black text-4xl uppercase -rotate-12 select-none text-black dark:text-white tracking-[0.2em]">
                    Radar
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Gradient shadow/glow inside mock app */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white dark:from-[#0A0A0A] via-white/50 dark:via-[#0A0A0A]/50 to-transparent pointer-events-none" />
          </motion.div>
          
          {/* Floating tags - enhanced with depth */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            animate={{ y: [0, -25, 0], x: [0, 8, 0], rotate: [5, 8, 5] }}
            transition={{ 
              initial: { delay: 1, duration: 0.8 },
              animate: { duration: 5, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -top-10 -right-10 bg-[#58CC02] text-white px-6 py-3.5 rounded-[24px] font-black text-[14px] shadow-2xl z-20 hidden lg:flex items-center gap-2 border-4 border-white dark:border-[#1A1A1A]"
          >
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Clue Unlocked!
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            animate={{ y: [0, 25, 0], x: [0, -8, 0], rotate: [-5, -8, -5] }}
            transition={{ 
              initial: { delay: 1.2, duration: 0.8 },
              animate: { duration: 6, repeat: Infinity, delay: 0.5, ease: "easeInOut" }
            }}
            className="absolute -bottom-10 -left-10 bg-[#1CB0F6] text-white px-6 py-3.5 rounded-[24px] font-black text-[14px] shadow-2xl z-20 hidden lg:flex items-center gap-2 border-4 border-white dark:border-[#1A1A1A]"
          >
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Rank #1 Reached
          </motion.div>
        </div>

        {/* Feature Cards - Merged back as requested */}
        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.15,
                delayChildren: 0.3
              }
            }
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              variants={{
                hidden: { opacity: 0, y: 50, scale: 0.9 },
                show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", damping: 20, stiffness: 100 } }
              }}
              animate={{
                y: [0, -15, 0],
                rotate: [0, i % 2 === 0 ? 1 : -1, 0]
              }}
              transition={{
                animate: {
                  duration: f.floatDuration,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: f.floatDelay,
                }
              }}
              className="bg-white dark:bg-white/[0.03] border border-black/5 dark:border-white/10 rounded-[32px] p-8 shadow-[0_4px_0_rgba(0,0,0,0.04)] dark:shadow-none transition-all duration-300 group hover:scale-[1.02] cursor-default relative overflow-hidden"
            >
              {/* Card internal glow */}
              <div className="absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500" style={{ background: f.color }} />
              
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-all group-hover:rotate-12 group-hover:scale-110 duration-300 shadow-sm"
                style={{ background: f.bg }}
              >
                <f.icon size={28} color={f.color} strokeWidth={2.5} />
              </div>
              
              <h3 className="text-[22px] font-black text-[#2B2B2B] dark:text-white mb-4 tracking-tight">
                {f.title}
              </h3>
              
              <p className="text-[16px] font-semibold leading-relaxed text-[#777] dark:text-white/65">
                {f.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
