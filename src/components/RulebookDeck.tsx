import { motion } from "motion/react";
import { BookOpen, ChevronDown } from "lucide-react";
import { useState } from "react";

export const RULES = [
  { icon: "🗺️", title: "Initial Clue", desc: "Initially, all teams will be given a clue, and it will lead to checkpoints." },
  { icon: "📍", title: "Checkpoints", desc: "There are checkpoints where you must go. A volunteer will be present at every checkpoint." },
  { icon: "⏱️", title: "Time Interval", desc: "At each checkpoint, you will be given a task. After completing the task, there will be a 40-minute interval before you receive the next clue." },
  { icon: "🛰️", title: "Location Access", desc: "Real-time location access is mandatory to ensure fair play and prevent cheating. Teams with disabled GPS will be flagged." },
  { icon: "🏃", title: "Team Presence", desc: "All team members must be present at each checkpoint to receive the next clue." },
  { icon: "📵", title: "Fair Play", desc: "No use of unauthorized digital aids or external help unless specified." },
  { icon: "🚫", title: "No Vehicles", desc: "Using any kind of vehicle is strictly prohibited. Teams found using vehicles will be disqualified." },
  { icon: "🤝", title: "Respect", desc: "Treat volunteers and other teams with respect. Decisions by organizers are final." },
  { icon: "🎒", title: "Essentials", desc: "Keep your water, snacks, and power banks ready. The hunt might take several hours." },
  { icon: "🚩", title: "Completion", desc: "The first team to reach the final destination with all tasks completed wins!" },
  { icon: "🆘", title: "Emergency", desc: "Contact the organizers immediately if any team member feels unwell or faces issues." },
];

interface RulebookDeckProps {
  initialExpanded?: boolean;
  className?: string;
}

export function RulebookDeck({ initialExpanded = false, className = "" }: RulebookDeckProps) {
  const [showRules, setShowRules] = useState(initialExpanded);

  return (
    <div 
      className={`rounded-[32px] overflow-hidden bg-white border-2 border-black/[0.04] shadow-sm ${className}`} 
      style={{ borderBottomWidth: "8px" }}
    >
      <button
        onClick={() => setShowRules(!showRules)}
        className="w-full flex items-center justify-between p-6 sm:p-7 text-left hover:bg-black/[0.01] transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#DCF1FE] flex items-center justify-center text-[#1CB0F6]">
            <BookOpen size={22} strokeWidth={2.5} />
          </div>
          <div>
            <span className="block text-[16px] font-black" style={{ color: "#2B2B2B" }}>Rulebook & Details</span>
            <span className="text-[11px] font-bold text-[#777] uppercase tracking-wider">Tap to expand guidelines</span>
          </div>
        </div>
        <motion.div
          animate={{ rotate: showRules ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <ChevronDown size={20} style={{ color: "#999" }} />
        </motion.div>
      </button>

      <motion.div
        initial={false}
        animate={{ height: showRules ? "auto" : 0, opacity: showRules ? 1 : 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden bg-[#FBFBFB] border-t-2 border-black/[0.03]"
      >
        <div className="p-5 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {RULES.map((rule, i) => (
              <motion.div
                key={rule.title}
                initial={{ opacity: 0, y: 10 }}
                animate={showRules ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white border-2 border-black/[0.04] rounded-[24px] p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                style={{ borderBottomWidth: "6px" }}
              >
                <div className="flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F7F7F7] flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                    {rule.icon}
                  </div>
                  <div>
                    <h4 className="text-[14px] font-black tracking-tight" style={{ color: "#2B2B2B" }}>{rule.title}</h4>
                    <p className="text-[12px] font-semibold mt-1.5 leading-relaxed" style={{ color: "#777" }}>{rule.desc}</p>
                  </div>
                </div>
                <span className="absolute top-4 right-4 text-[10px] font-black text-black/5 group-hover:text-black/10 transition-colors">
                  {(i + 1).toString().padStart(2, '0')}
                </span>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-black/5 text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-black/20">
              End of Rulebook · Good Luck Huntress/Hunter
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
