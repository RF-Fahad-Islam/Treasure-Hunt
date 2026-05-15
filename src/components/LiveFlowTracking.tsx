import { motion } from "motion/react";
import type { ArrivingTeam } from "@/services/spotLeader";

interface LiveFlowTrackingProps {
  teams: ArrivingTeam[];
  currentSpotId?: string; // Optional: to highlight if the team is at the current leader's spot
  hideFutureSpots?: boolean; // Obfuscate future spot names as "???"
  onSpotClick?: (spotId: string, spotName: string) => void; // Click a revealed spot to view on map
}

export function LiveFlowTracking({ teams, hideFutureSpots, onSpotClick }: LiveFlowTrackingProps) {
  return (
    <div className="flex flex-col gap-10">
      {teams.map((team, tIdx) => {
        const teamRoute = team.fullRoute;
        
        return (
          <motion.div 
            key={team.teamId} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: tIdx * 0.05 }}
            className="relative group"
          >
            <div className="mb-4 flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <motion.div 
                  whileHover={{ rotate: 10 }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-sm" 
                  style={{ background: "linear-gradient(135deg, #1CB0F6, #007AFF)" }}
                >
                  {team.teamName.charAt(0)}
                </motion.div>
                <div className="flex flex-col">
                  <span className="text-[16px] font-black text-[#2B2B2B]">{team.teamName}</span>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#999]">Team #{team.teamCode}</span>
                </div>
              </div>
                <div className="flex flex-col items-end">
                <span className="text-[15px] font-black text-[#58CC02]">
                  {teamRoute.filter(r => ['completed', 'revealed', 'solved'].includes(r.status || '')).length} / {teamRoute.length}
                </span>
                <span className="text-[9px] font-black uppercase tracking-tighter text-[#aaa]">Cleared</span>
              </div>
            </div>

            {/* Flow Path */}
            <div className="relative flex items-center gap-0 overflow-x-auto pb-6 scrollbar-hide">
              {/* Background track line */}
              <div className="absolute top-[28px] left-[40px] right-[40px] h-1.5 rounded-full bg-[#F0F0F0]" />
              
              {teamRoute.map((step, idx) => {
                const isCompleted = ['completed', 'revealed', 'solved'].includes(step.status || '');
                const isActive = step.isCurrent && !team.huntCompleted;
                const currentIdx = teamRoute.findIndex(r => r.isCurrent);
                const isPassed = !isActive && (isCompleted || (currentIdx >= 0 && idx < currentIdx)); 

                return (
                  <div key={idx} className="relative z-10 flex flex-col items-center min-w-[160px] first:pl-4 last:pr-4">
                    {/* Filled track line segment */}
                    {idx > 0 && (isPassed || (isActive && step.arrivalApproved)) && (
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        className="absolute top-[28px] -left-1/2 h-1.5" 
                        style={{ 
                          background: isPassed ? "#58CC02" : "#1CB0F6", 
                          zIndex: -1,
                          opacity: isPassed ? 1 : 0.4
                        }} 
                      />
                    )}

                    {/* Node Icon */}
                    <motion.div 
                      whileHover={{ scale: 1.1, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const revealed = isCompleted || isActive;
                        if (revealed && onSpotClick && step.spotId) {
                          onSpotClick(step.spotId, step.spotName);
                        }
                      }}
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center border-[4px] transition-all duration-500 ${isActive ? 'scale-110 shadow-lg ring-4 ring-[#1CB0F620]' : ''} ${!hideFutureSpots || isCompleted || isActive ? 'cursor-pointer' : ''}`}
                      style={{ 
                        background: isCompleted ? "#58CC02" : isActive ? "#1CB0F6" : "#FFFFFF",
                        borderColor: isCompleted ? "#46A302" : isActive ? "#0f7ac0" : "#F0F0F0",
                        color: isCompleted || isActive ? "white" : "#CCC",
                      }}
                    >
                      <span className="text-[18px] font-black">
                        {isCompleted ? "🏆" : isActive ? "🎯" : hideFutureSpots ? "?" : (idx + 1)}
                      </span>
                    </motion.div>

                    {/* Spot details */}
                    <div className="mt-3 text-center px-2">
                      <p className={`text-[11px] font-black uppercase truncate max-w-[130px] ${isActive ? 'text-[#1CB0F6]' : isPassed ? 'text-[#58CC02]' : 'text-[#777]'}`}>
                        {hideFutureSpots && !isCompleted && !isActive ? "???" : step.spotName}
                      </p>
                      
                      {/* SUB MARKERS (The "Activities" Subtasks) */}
                      <div className="mt-2 flex justify-center gap-2">
                         {/* Arrival Marker */}
                         <div className="relative group/sub">
                           <motion.div 
                             initial={step.arrivalApproved ? { scale: 0 } : {}}
                             animate={step.arrivalApproved ? { scale: 1 } : {}}
                             className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] shadow-sm transition-colors ${step.arrivalApproved ? 'bg-[#58CC02] text-white' : 'bg-gray-100 text-gray-300'}`}
                           >
                             📍
                           </motion.div>
                           {/* Sub-label */}
                           <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-tighter opacity-0 group-hover/sub:opacity-100 transition-opacity whitespace-nowrap" style={{ color: step.arrivalApproved ? '#58CC02' : '#CCC' }}>
                             Arrival
                           </span>
                         </div>

                         {/* Mini-Game Marker */}
                         {step.hasMiniGame && (
                           <div className="relative group/sub">
                             <motion.div 
                               initial={step.miniGamePlayed ? { scale: 0 } : {}}
                               animate={step.miniGamePlayed ? { scale: 1 } : {}}
                               className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] shadow-sm transition-colors ${step.miniGamePlayed ? 'bg-[#FFC800] text-white' : 'bg-gray-100 text-gray-300'}`}
                             >
                               🎮
                             </motion.div>
                             <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-tighter opacity-0 group-hover/sub:opacity-100 transition-opacity whitespace-nowrap" style={{ color: step.miniGamePlayed ? '#FFC800' : '#CCC' }}>
                               Game
                             </span>
                           </div>
                         )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
